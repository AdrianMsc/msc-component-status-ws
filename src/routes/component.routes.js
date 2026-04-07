import express from 'express';
import upload from '../middlewares/multer.js';
import { requireAuth } from '../middlewares/session.middleware.js';
import {
	handshake,
	getAllComponentNames,
	getComponentCount,
	getAllComponents,
	createComponent,
	updateComponent,
	deleteComponent,
	updateComponentResources,
	uploadImage,
	getComponentVersions,
	getLatestComponentVersion,
	createComponentVersion,
	updateComponentVersion,
	deleteComponentVersion,
	setComponentLatestVersion,
	getComponentById
} from '../controllers/component.controller.js';

const router = express.Router();

router.get('/handshake', handshake);
router.get('/allcomponents', getAllComponentNames);
router.get('/count', getComponentCount);
router.get('/components', getAllComponents);
router.get('/components/:id', getComponentById);
router.get('/components/:id/versions', getComponentVersions);
router.get('/components/:id/versions/latest', getLatestComponentVersion);
router.post('/uploads/images', requireAuth, upload.single('image'), uploadImage);
router.post('/categories/:category/components', requireAuth, upload.single('image'), createComponent);
router.post('/components/:id/versions', requireAuth, createComponentVersion);
router.put('/components/resources/:id', requireAuth, updateComponentResources);
router.put('/categories/:category/components/:id', requireAuth, upload.single('image'), updateComponent);
router.put('/versions/:versionId', requireAuth, updateComponentVersion);
router.put('/versions/:versionId/set-latest', requireAuth, setComponentLatestVersion);
router.delete('/components/:id', requireAuth, deleteComponent);
router.delete('/versions/:versionId', requireAuth, deleteComponentVersion);

export default router;
