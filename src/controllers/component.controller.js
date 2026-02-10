import * as ComponentService from "../services/component.service.js";

export const handshake = async (_, res) => {
  await res.json("👍");
};

export const getAllComponentNames = async (_, res) => {
  try {
    const components = await ComponentService.getComponentNames();
    res.json(components);
  } catch (error) {
    console.error("Error fetching components:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getComponentCount = async (_, res) => {
  try {
    const count = await ComponentService.getComponentCount();
    res.json({ count });
  } catch (error) {
    console.error("Error counting components:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllComponents = async (_, res) => {
  try {
    const result = await ComponentService.getFormattedComponents();
    res.json(result);
  } catch (error) {
    console.error("Error fetching components:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createComponent = async (req, res) => {
  const { category } = req.params;
  const { name } = req.body;

  if (!name?.trim() || !category?.trim()) {
    return res
      .status(400)
      .json({ error: "Required fields: name and category." });
  }

  try {
    const { componentId } = await ComponentService.createNewComponent({
      ...req.body,
      category,
    });

    res.status(201).json({
      message: "Component created successfully.",
      componentId,
    });
  } catch (error) {
    console.error("Error creating component:", error.message);
    res.status(500).json({
      error: "An error occurred while creating the component.",
    });
  }
};

export const updateComponent = async (req, res) => {
  const { category, id } = req.params;
  const { name } = req.body;

  if (!name || !category || !id) {
    return res
      .status(400)
      .json({ error: "Required fields: name, category, and id." });
  }

  try {
    await ComponentService.modifyComponent(id, { ...req.body, category });

    return res.status(200).json({
      message: "Component, statuses, and platform links updated successfully.",
    });
  } catch (error) {
    if (error.message === "Component not found.") {
      return res.status(404).json({ error: "Component not found." });
    }
    console.error("Error updating component:", error);
    return res.status(500).json({
      error: "An error occurred while updating the component.",
    });
  }
};

export const updateComponentResources = async (req, res) => {
  const { id } = req.params;

  try {
    const { statusUpdated, linksUpdated } =
      await ComponentService.updateResources(id, req.body);

    res.status(200).json({
      message: "Component resources updated successfully.",
      updated: {
        statuses: statusUpdated,
        links: linksUpdated,
      },
    });
  } catch (error) {
    if (error.message === "No valid fields provided to update.") {
      return res.status(400).json({
        error: error.message,
      });
    }
    console.error("Error updating component resources:", error.message);
    res.status(500).json({ error: "Error updating component resources" });
  }
};

export const deleteComponent = async (req, res) => {
  const { id } = req.params;

  try {
    await ComponentService.removeComponent(id);

    res.status(200).json({
      message: "Component, related records, and image erased successfully.",
    });
  } catch (error) {
    if (
      error.message === "Component not found." ||
      error.message === "Component not found or could not be erased."
    ) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Error erasing component:", error);
    res.status(500).json({ message: "Error erasing component." });
  }
};
