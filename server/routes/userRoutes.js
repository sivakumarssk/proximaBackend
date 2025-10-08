const express = require('express');
const router = express.Router();
const homeCtrl = require('../controlers/homeControllers');
const aboutCtrl = require('../controlers/aboutUsController');
const serviceCtrl = require('../controlers/serviceController');
const galleryCtrl = require('../controlers/galleryController');
const upcomingCtrl = require('../controlers/upcomingEventController');
const conntactCtrl = require('../controlers/contactController');
const newsletterCtrl = require('../controlers/newsletterController');
const { getConferences, createConference, updateConference, deleteConference } = require('../controlers/conferenceController');
const { getSponsors, createSponsor, deleteSponsor } = require('../controlers/sponsorController');
const { login, register } = require('../controlers/LoginController');
const { getGuideline, saveGuideline } = require('../controlers/guidelineController');


router.post('/login',login)
router.post('/register',register)

router.get('/home', homeCtrl.getHome);
router.post('/home', homeCtrl.createHome);
router.patch('/homme/:id', homeCtrl.updateHome);

// Delete
router.delete('/home/:id', homeCtrl.deleteHome);


router.get('/aboutus', aboutCtrl.getAbout);
router.post('/aboutus', aboutCtrl.createAbout);
router.patch('/aboutus/:id', aboutCtrl.updateAbout);
router.delete('/aboutus/:id', aboutCtrl.deleteAbout);

router.get('/services', serviceCtrl.getServices);
router.post('/services', serviceCtrl.createServices);
router.patch('/services/:id', serviceCtrl.updateServices);
router.delete('/services/:id', serviceCtrl.deleteServices);

router.get('/gallery',   galleryCtrl.getGallery);
router.post('/gallery',  galleryCtrl.createGallery);
router.patch('/gallery/:id', galleryCtrl.updateGallery);
router.delete('/gallery/:id', galleryCtrl.deleteGallery);

router.get('/upcoming', upcomingCtrl.getUpcoming);
router.post('/upcoming', upcomingCtrl.createUpcoming);
router.patch('/upcoming/:id', upcomingCtrl.updateUpcoming);
router.delete('/upcoming/:id', upcomingCtrl.deleteUpcoming);

router.post('/contact', conntactCtrl.createContact);
router.get('/contact', conntactCtrl.listContacts);
router.get('/contact/:id', conntactCtrl.getContact);
router.patch('/contact/:id', conntactCtrl.updateContact);
router.delete('/contact/:id', conntactCtrl.deleteContact);

router.post('/newsletter/subscribe', newsletterCtrl.subscribe);
router.get('/newsletter', newsletterCtrl.list);
router.patch('/newsletter/:id', newsletterCtrl.update);
router.delete('/newsletter/:id', newsletterCtrl.remove);


router.route("/conferences").get(getConferences).post(createConference);
router.route("/conferences/:id")
  .put(updateConference)
  .delete(deleteConference);

router.route("/sponsors").get(getSponsors).post(createSponsor);
router.route("/sponsors/:id")
  .delete(deleteSponsor);

router.route("/guidelines")
  .get(getGuideline)
  .post(saveGuideline);


module.exports = router;