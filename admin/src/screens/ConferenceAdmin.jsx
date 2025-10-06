import { useEffect, useState } from "react";
const API = "http://localhost:5000";

export default function ConferenceAdmin() {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);

  const fetchConferences = async () => {
    const res = await fetch(`${API}/api/conferences`);
    const json = await res.json();
    if (json.success) setList(json.data);
  };

  useEffect(() => {
    fetchConferences();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `${API}/api/conferences/${editId}`
      : `${API}/api/conferences`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const json = await res.json();
    if (json.success) {
      setName("");
      setEditId(null);
      fetchConferences();
    }
  };

  const handleEdit = (conf) => {
    setName(conf.name);
    setEditId(conf._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this conference?")) return;
    const res = await fetch(`${API}/api/conferences/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) fetchConferences();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8  mt-[5%] max-w-[60%] w-full">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Conferences</h2>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Conference name"
            className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {editId ? "Update" : "Add"}
          </button>
        </form>

        <ul className="divide-y divide-gray-200">
          {list.map((conf) => (
            <li
              key={conf._id}
              className="flex justify-between items-center py-2"
            >
              <span className="text-gray-800">{conf.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(conf)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(conf._id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
