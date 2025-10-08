import { useEffect, useState } from "react";
const API = "https://admin.theproxima.org";

export default function SponsorsList() {
  const [list, setList] = useState([]);

  const fetchSponsors = async () => {
    const res = await fetch(`${API}/api/sponsors`);
    const json = await res.json();
    if (json.success) setList(json.data);
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sponsor submission?")) return;
    const res = await fetch(`${API}/api/sponsors/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) fetchSponsors();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 mt-[5%] max-w-[60%] w-full">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Sponsor Submissions</h2>
        {list.length === 0 ? (
          <p className="text-gray-500 text-center">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 border-b">#</th>
                  <th className="p-3 border-b text-left">Name</th>
                  <th className="p-3 border-b text-left">Email</th>
                  <th className="p-3 border-b text-left">Conference</th>
                  <th className="p-3 border-b text-left">Country</th>
                  <th className="p-3 border-b text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s, i) => (
                  <tr key={s._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3">{s.email}</td>
                    <td className="p-3">{s.sponsor?.name || "-"}</td>
                    <td className="p-3">{s.country}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
