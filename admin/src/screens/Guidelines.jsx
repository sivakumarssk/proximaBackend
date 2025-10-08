import { useEffect, useState } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const API = "https://admin.theproxima.org";

export default function Guidelines() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  useEffect(() => {
    axios.get(`${API}/api/guidelines`).then((res) => {
      if (res.data.success && res.data.data) setContent(res.data.data.speaker);
    });
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/guidelines`, { speaker: content });
      alert("Guideline saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save guideline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 mt-[5%]">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Sponsorship Guidelines Editor
        </h1>

        <ReactQuill
          modules={modules}
          value={content}
          onChange={setContent}
          className="mb-6 h-60"
          placeholder="Write sponsorship guidelines here..."
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-6 py-3 mt-10 rounded-lg text-white font-semibold transition ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Save Guidelines"}
        </button>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Preview:</h2>
          <div
            className="prose max-w-none border rounded-lg p-4 bg-gray-50"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
}
