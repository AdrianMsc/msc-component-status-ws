import sql from "../config/db.js";

export const getInboxMessages = async (_, res) => {
  try {
    const query = "select * from feedback c order by c.created_at";
    const inbox = await sql(query);
    res.json(inbox);
  } catch (error) {
    console.error("Error fetching inbox elements:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const newInboxMessage = async (req, res) => {
  const { name, email, message, status = "pending", read = false } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Name, Email, and Message are required" });
  }

  try {
    const query = `
      INSERT INTO feedback (name, email, message, status, read)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;

    const values = [name, email, message, status, read];

    const result = await sql(query, values);

    res.status(201).json({
      response: "Message successfully added!",
      success: true,
      name: name,
      email: email,
      message: message,
      status: status,
      read: read,
    });
  } catch (err) {
    console.error("Error inserting feedback:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const deleteInboxMessage = async (req, res) => {
  const { id } = req.params;

  try {
    const query = "DELETE FROM feedback WHERE id = $1 RETURNING *";
    const result = await sql(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json({
      response: "Message deleted successfully",
      id: id,
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
