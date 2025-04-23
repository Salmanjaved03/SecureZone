import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  updateIncidentReportTags,
  getIncidentReport,
  IncidentReport,
} from "../services/api";
import { AxiosResponse } from "axios";

interface EditIncidentFormData {
  tags: string; // Comma-separated tags
}

interface EditIncidentReportProps {
  user: { id: string; username: string; role: string; email: string } | null;
}

const EditIncidentReport: React.FC<EditIncidentReportProps> = ({ user }) => {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    setValue,
  } = useForm<EditIncidentFormData>();
  const [message, setMessage] = React.useState<string>("");
  const [report, setReport] = React.useState<IncidentReport | null>(null);

  useEffect(() => {
    if (!user || !reportId) {
      setMessage("User not authenticated or report ID missing");
      navigate("/");
      return;
    }

    const fetchReport = async () => {
      try {
        const response: AxiosResponse<{ report: IncidentReport }> =
          await getIncidentReport(reportId);
        setReport(response.data.report);
        // Pre-populate tags
        setValue(
          "tags",
          response.data.report.tags.map((tag) => tag.name).join(", ")
        );
      } catch (error: any) {
        setMessage(error.response?.data?.message || "Failed to fetch report");
        navigate("/reports-timeline");
      }
    };

    fetchReport();
  }, [user, reportId, navigate, setValue]);

  const onSubmit: SubmitHandler<EditIncidentFormData> = async (data) => {
    if (!user || !reportId) {
      setMessage("User not authenticated or report ID missing");
      navigate("/");
      return;
    }

    // Validate tags
    if (data.tags && data.tags.trim().length === 0) {
      setError("tags", {
        type: "manual",
        message: "Tags cannot be empty if provided",
      });
      return;
    }

    try {
      const response: AxiosResponse<{
        message: string;
        report: IncidentReport;
      }> = await updateIncidentReportTags(reportId, user.email, data.tags);
      setMessage(response.data.message || "Tags updated successfully!");
      reset();
      setTimeout(() => navigate("/reports-timeline"), 2000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Failed to update tags");
    }
  };

  if (!user || !report) {
    return null;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Edit Incident Report Tags
      </h2>
      {message && (
        <p
          style={{
            color: message.includes("success") ? "green" : "red",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          {message}
        </p>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label
            htmlFor="tags"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            Tags (optional, comma-separated, e.g., Safety,Urgent)
          </label>
          <input
            id="tags"
            type="text"
            {...register("tags")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          />
          {errors.tags && (
            <p
              style={{
                color: "red",
                fontSize: "0.75rem",
                marginTop: "0.25rem",
              }}
            >
              {errors.tags.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          style={{
            padding: "0.75rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Update Tags
        </button>
      </form>
      <button
        onClick={() => navigate("/reports-timeline")}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "4px",
          width: "100%",
          fontSize: "1rem",
        }}
      >
        Back to Timeline
      </button>
    </div>
  );
};

export default EditIncidentReport;
