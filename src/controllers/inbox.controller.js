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
  try {
    const {
      name,
      email,
      message,
      status = "pending",
      read = false,
    } = req.body ?? {};

    // Validación simple pero clara
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required.",
      });
    }

    const query = `
      INSERT INTO feedback (name, email, message, status, read)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;

    const values = [name.trim(), email.trim(), message.trim(), status, read];

    const [{ id }] = await sql(query, values);

    return res.status(201).json({
      success: true,
      message: "Message successfully added!",
      data: {
        id,
        name,
        email,
        message,
        status,
        read,
      },
    });
  } catch (error) {
    console.error("Error inserting feedback:", error);

    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    });
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
