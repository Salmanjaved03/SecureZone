import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { createIncidentReport, CreateReportResponse } from "../services/api";
import { AxiosResponse } from "axios";

interface IncidentFormData {
  title: string;
  description: string;
  location: string;
  image: FileList | undefined;
  isAnonymous?: boolean;
  tags: string; // Comma-separated tags
}

interface CreateIncidentReportProps {
  user: { id: string; username: string; role: string; email: string } | null;
}

const CreateIncidentReport: React.FC<CreateIncidentReportProps> = ({
  user,
}) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<IncidentFormData>();
  const [message, setMessage] = React.useState<string>("");

  const onSubmit: SubmitHandler<IncidentFormData> = async (data) => {
    if (!user) {
      setMessage("User not authenticated");
      navigate("/");
      return;
    }

    // Validate image type
    if (data.image && data.image.length > 0) {
      const validImageTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validImageTypes.includes(data.image[0].type)) {
        setError("image", {
          type: "manual",
          message: "Only image files (.jpg, .jpeg, .png) are allowed",
        });
        return;
      }
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
      const response: AxiosResponse<CreateReportResponse> =
        await createIncidentReport(
          data.title,
          data.description,
          data.location || "",
          user.id,
          data.image && data.image.length > 0 ? data.image[0] : undefined,
          data.isAnonymous || false,
          data.tags // Pass tags as comma-separated string
        );
      setMessage(
        response.data.message || "Incident report created successfully!"
      );
      reset();
      setTimeout(() => navigate("/reports-timeline"), 2000);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Failed to create incident report"
      );
    }
  };

  if (!user) {
    navigate("/");
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
        Create Incident Report
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
            htmlFor="title"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            {...register("title", { required: "Title is required" })}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          />
          {errors.title && (
            <p
              style={{
                color: "red",
                fontSize: "0.75rem",
                marginTop: "0.25rem",
              }}
            >
              {errors.title.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="description"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            Description
          </label>
          <textarea
            id="description"
            {...register("description", {
              required: "Description is required",
            })}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              minHeight: "100px",
              fontSize: "1rem",
            }}
          />
          {errors.description && (
            <p
              style={{
                color: "red",
                fontSize: "0.75rem",
                marginTop: "0.25rem",
              }}
            >
              {errors.description.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="location"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            Location
          </label>
          <input
            id="location"
            type="text"
            {...register("location", { required: "Location is required" })}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          />
          {errors.location && (
            <p
              style={{
                color: "red",
                fontSize: "0.75rem",
                marginTop: "0.25rem",
              }}
            >
              {errors.location.message}
            </p>
          )}
        </div>
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
        <div>
          <label
            htmlFor="image"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            Image (optional, only .jpg, .jpeg, .png allowed)
          </label>
          <input
            id="image"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            {...register("image")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          />
          {errors.image && (
            <p
              style={{
                color: "red",
                fontSize: "0.75rem",
                marginTop: "0.25rem",
              }}
            >
              {errors.image.message}
            </p>
          )}
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            <input
              type="checkbox"
              {...register("isAnonymous")}
              style={{ marginRight: "0.5rem" }}
            />
            Submit Anonymously
          </label>
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
          Submit Report
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

export default CreateIncidentReport;
