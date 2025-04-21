import React, { useState, useEffect } from "react";
import {
  getComments,
  createComment,
  Comment,
  CommentsResponse,
  CreateCommentResponse,
} from "../services/api";
import { AxiosResponse } from "axios";
import styles from "./CommentList.module.css";

interface CommentListProps {
  reportId: string;
  userEmail: string;
}

const CommentList: React.FC<CommentListProps> = ({ reportId, userEmail }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response: AxiosResponse<CommentsResponse> = await getComments(
          reportId
        );
        setComments(response.data.comments || []);
      } catch (error: any) {
        console.error(
          "Fetch comments error:",
          error.response?.data || error.message
        );
        setMessage("Failed to fetch comments");
      }
    };
    fetchComments();
  }, [reportId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setMessage("Comment cannot be empty");
      return;
    }

    try {
      const response: AxiosResponse<CreateCommentResponse> =
        await createComment(userEmail, reportId, newComment);
      setComments([...comments, response.data.comment]);
      setNewComment("");
      setMessage("Comment posted successfully");
    } catch (error: any) {
      console.error(
        "Create comment error:",
        error.response?.data || error.message
      );
      setMessage(error.response?.data?.message || "Failed to post comment");
    }
  };

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem",
        borderTop: "1px solid #ddd",
      }}
    >
      <h4
        style={{
          fontSize: "1.1rem",
          fontWeight: "bold",
          marginBottom: "0.5rem",
          color: "#333",
        }}
      >
        Comments
      </h4>
      {message && (
        <p
          style={{
            color: message.includes("successfully") ? "green" : "red",
            marginBottom: "0.5rem",
          }}
        >
          {message}
        </p>
      )}
      {comments.length === 0 ? (
        <p style={{ color: "#666", fontSize: "0.875rem" }}>No comments yet</p>
      ) : (
        comments.map((comment) => (
          <div
            key={comment.id}
            style={{
              padding: "0.5rem 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "#333", margin: "0" }}>
              <strong>{comment.user.username}</strong> (
              {new Date(comment.createdAt).toLocaleString()})
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#555",
                margin: "0.25rem 0 0",
              }}
            >
              {comment.content}
            </p>
          </div>
        ))
      )}
      <form
        onSubmit={handleCommentSubmit}
        style={{
          display: "flex",
          gap: "0.5rem",
          marginTop: "0.5rem",
          alignItems: "center",
        }}
      >
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            resize: "vertical",
            fontSize: "0.875rem",
            minHeight: "60px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Post Comment
        </button>
      </form>
    </div>
  );
};

export default CommentList;
