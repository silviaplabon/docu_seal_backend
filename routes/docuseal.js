const express = require("express");
const axios = require("axios");
const multer = require("multer");
const router = express.Router();

const DOCUSEAL_API_BASE =
  process.env.DOCUSEAL_API_BASE || "https://api.docuseal.com";
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  if (!DOCUSEAL_API_KEY) {
    return res.status(500).json({
      error: "DocuSeal API key not configured",
      message: "Please set DOCUSEAL_API_KEY in environment variables",
    });
  }
  next();
};

// Helper function to make DocuSeal API requests
const makeDocuSealRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${DOCUSEAL_API_BASE}${endpoint}`,
      headers: {
        "X-Auth-Token": DOCUSEAL_API_KEY?.trim(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);

    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    console.error(
      "DocuSeal API Error:",
      error,
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || { message: error.message },
      status: error.response?.status || 500,
    };
  }
};
router.delete("/submissions", async (req, res) => {
  const { name } = req.query;
  let endpoint = name
    ? `/submissions?q=${name}&limit=1000`
    : `/submissions?limit=1000`;
  const result = await makeDocuSealRequest("GET", endpoint);
  if (!result.success) {
    return res.status(result.status || 500).json(result.error);
  }
  const submissions = result.data?.data || [];
  console.log(submissions, result, "submissions to delete---line42");
  const deleteResults = await Promise.allSettled(
    submissions.map((submission) => {
      const delEndpoint = `/submissions/${submission.id}?permanently=true`;
      return makeDocuSealRequest("DELETE", delEndpoint);
    })
  );
  console.log(deleteResults, "deleteResults=========line74");
  // Prepare response with deleted submission ids and status
  const deleted = submissions.map((submission, idx) => ({
    id: submission.id,
    status: deleteResults[idx].status,
    value: deleteResults[idx].value || null,
    reason: deleteResults[idx].reason || null,
  }));
  res.json({ deleted });
});

// POST /api/docuseal/submit-agreement-with-signatures - Submit agreement with signatures
router.post("/submit-agreement-with-signatures", async (req, res) => {
  try {
    const {
      documents,
      submitters,
      name,
      archived = false,
      bcc_completed,
      reply_to,
      expire_at,
      id,
    } = req.body;
    const endpoint = `/submissions?q=${id}&limit=100`;
    const result = await makeDocuSealRequest("GET", endpoint);
    if (!result.success) {
      return res.status(result.status || 500).json({
        error: result.error,
        message: "Failed to fetch submissions for deletion.",
      });
    }
    const submissions = result.data?.data || [];
    let deleteResults = [];
    try {
      const settled = await Promise.allSettled(
        submissions.map((submission) => {
          const delEndpoint = `/submissions/${submission.id}?permanently=true`;
          return makeDocuSealRequest("DELETE", delEndpoint);
        })
      );
      deleteResults = submissions.map((submission, idx) => ({
        id: submission.id,
        status: settled[idx].status,
        value: settled[idx].value || null,
        reason: settled[idx].reason || null,
      }));
    } catch (err) {
      console.error("Error deleting submissions:", err);
    }
    const staticPayload = {
      send_email: false,
      send_sms: false,
      order: "preserved",
      completed_redirect_url: "",
      bcc_completed: "",
      reply_to: '',
      expire_at: expire_at,
      merge_documents: false,
      remove_tags: true,
      message: {
        subject: "Please complete your digital signature",
        body: "Hello, please review and sign the attached document.",
      },
    };
    const payload = {
      name,
      documents,
      submitters,
      ...staticPayload,
    };
    const resp = await makeDocuSealRequest("POST", `/submissions/pdf`, payload);
    if (!resp.success) {
      return res.status(resp.status || 500).json({
        error: resp.error,
        message: "Failed to create new submission.",
      });
    }
    res.json({ submission: resp.data, deleted: deleteResults });
  } catch (err) {
    console.error("DocuSeal API error:", err);
    res.status(500).json({ error: err.message || err });
  }
});

router.get("/submissions", checkApiKey, async (req, res) => {
  const { name, archived = "false" } = req.query;

  if (!name) {
    return res.status(400).json({
      error: "The 'name' query parameter is required.",
    });
  }

  try {
    // Correct endpoint (avoid double slash)
    const endpoint = `/submissions?q=${name}&archived=${archived}&limit=100`;

    const result = await makeDocuSealRequest("GET", endpoint);

    if (!result.success) {
      return res.status(result.status || 500).json(result.error);
    }

    const submissions = result.data?.data || [];

    if (submissions.length === 0) {
      return res.status(404).json({
        error: "No matching submissions found",
      });
    }

    console.log(submissions, "result data --- line100");

    return res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions by name:", error);

    return res.status(500).json({
      error: error?.message || "Internal server error",
      message: "Failed to fetch submissions by name",
    });
  }
});

router.get("/submissions/:name", checkApiKey, async (req, res) => {
  const { name } = req.params;
  if (!name) {
    return res.status(400).json({
      error: "The 'name' path parameter is required.",
    });
  }
  try {
    const endpointSubmissions = `/submissions?q=${name}&archived=false&limit=1`;
    const resultSubmissions = await makeDocuSealRequest("GET", endpointSubmissions);
    if (!resultSubmissions.success) {
      return res.status(resultSubmissions.status || 500).json({
        error: resultSubmissions.error,
        message: "Failed to fetch submissions by name."
      });
    }
    const submissions = resultSubmissions.data?.data || [];
    if (submissions.length === 0) {
      return res.status(404).json({
        error: "No matching submissions found",
        message: `No submissions found for name: ${name}`
      });
    }
    const endpoint = `/submissions/${submissions[0]?.id}`;
    const result = await makeDocuSealRequest("GET", endpoint);
    if (!result.success) {
      return res.status(result.status || 500).json({
        error: result.error,
        message: "Failed to fetch submission by ID."
      });
    }
    return res.json(result.data);
  } catch (error) {
    console.error("Error fetching document by name:", error);
    return res.status(500).json({
      error: error?.message || error,
      message: "Failed to fetch document by name."
    });
  }
});

module.exports = router;
