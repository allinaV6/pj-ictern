import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

/* ===============================
   ✅ Type ให้ตรงกับ MySQL Table
================================= */
interface InternshipPostType {
  post_id: number;
  internship_title: string;
  internship_location: string;
  internship_duration: string;
  internship_description: string;
  internship_responsibilities: string;
  internship_requirements: string;
  internship_compensation: string;
  internship_working_method: string;
  internship_link?: string;
  internship_expired_date: string;
}

function InternshipPost() {
  const [posts, setPosts] = useState<InternshipPostType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

useEffect(() => {
  fetch("http://localhost:5000/api/posts")
    .then(res => {
      if (!res.ok) {
        throw new Error("Server error");
      }
      return res.json();
    })
    .then(data => {
      console.log("🔥 API RAW DATA:", data);

      // ป้องกัน crash ถ้าไม่ใช่ array
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        console.error("API ไม่ได้ส่ง array:", data);
        setPosts([]);
      }

      setLoading(false);
    })
    .catch(err => {
      console.error("FETCH ERROR:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
      setLoading(false);
    });
}, []);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2 className="mb-4">Internship Opportunities</h2>

        {loading && <p>กำลังโหลดข้อมูล...</p>}
        {error && <p className="text-danger">{error}</p>}

        <div className="row">
          {posts.map((post) => (
            <div key={post.post_id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    {post.internship_title}
                  </h5>

                  <p className="text-muted">
                    📍 {post.internship_location}
                  </p>

                  <p>
                    <strong>Duration:</strong>{" "}
                    {post.internship_duration}
                  </p>

                  <p>
                    {post.internship_description}
                  </p>

                  <p>
                    <strong>Responsibilities:</strong><br />
                    {post.internship_responsibilities}
                  </p>

                  <p>
                    <strong>Requirements:</strong><br />
                    {post.internship_requirements}
                  </p>

                  <p>
                    <strong>Compensation:</strong>{" "}
                    {post.internship_compensation}
                  </p>

                  <p>
                    <strong>Working Method:</strong>{" "}
                    {post.internship_working_method}
                  </p>

                  {post.internship_link && (
                    <a
                      href={post.internship_link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary mt-2"
                    >
                      Apply Now
                    </a>
                  )}
                </div>

                <div className="card-footer text-muted">
                  Expire: {post.internship_expired_date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default InternshipPost;