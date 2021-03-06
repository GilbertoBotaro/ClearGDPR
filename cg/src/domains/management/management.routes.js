const express = require('express');
const { verifyJWT } = require('./management.helpers');
const asyncHandler = require('express-async-handler');
const winston = require('winston');
const router = express.Router();

const ContractController = require('./contract/contract.controller');
const contractController = new ContractController();

const UsersController = require('./users/users.controller'); // For managers
const usersController = new UsersController();

const SubjectsController = require('./subjects/subjects.controller'); // For data subjects
const subjectsController = new SubjectsController();

const StatsController = require('./stats/stats.controller.js');
const statsController = new StatsController();

const ProcessorsController = require('./processors/processors.controller');
const processorsController = new ProcessorsController();

const DataController = require('./data/data.controller');
const dataController = new DataController();

const { contractDeployValidator } = require('./contract/contract.validators');

const {
  addProcessorValidator,
  updateProcessorValidator,
  deleteProcessorValidator,
  testAddProcessorValidator,
  testDeleteProcessorsValidator
} = require('./processors/processors.validators');

const {
  listSubjectsValidator,
  listRectificationRequestsValidator,
  getRectificiationValidator,
  updateRectificationStatusValidator
} = require('./subjects/subjects.validators');

const {
  usersLoginValidator,
  usersRegistrationValidator,
  usersRemovalValidator,
  usersUpdatePasswordValidator
} = require('./users/users.validators');

const { updateAttributesConfigValidator } = require('./data/data.validators');

module.exports = app => {
  app.use('/management', router);

  // keep this before the jwt middleware for now
  router.ws('/events/feed', async (ws, req) => {
    try {
      await contractController.subscribeToEventFeed(ws, req);
    } catch (e) {
      ws.send('Error subscribing to blockchain');
      winston.error(e);
    }
  });

  router.post(
    '/users/login',
    usersLoginValidator,
    asyncHandler(async (req, res) => usersController.login(req, res))
  );

  router.use(verifyJWT);

  router.get(
    '/contract/details',
    asyncHandler(async (req, res) => contractController.getContractDetails(req, res))
  );

  router.post(
    '/contract/deploy',
    contractDeployValidator,
    asyncHandler(async (req, res) => contractController.deployContract(req, res))
  );

  router.get(
    '/subjects',
    listSubjectsValidator,
    asyncHandler(async (req, res) => subjectsController.listSubjects(req, res))
  );

  router.get(
    '/subjects/rectification-requests',
    listRectificationRequestsValidator,
    asyncHandler(async (req, res) => subjectsController.listRectificationRequests(req, res))
  );

  router.get(
    '/subjects/rectification-requests/archive',
    listRectificationRequestsValidator,
    asyncHandler(async (req, res) =>
      subjectsController.listProcessedRectificationRequests(req, res)
    )
  );

  router.get(
    '/subjects/rectification-requests/:rectificationRequestId',
    getRectificiationValidator,
    asyncHandler(async (req, res) => subjectsController.getRectificationRequest(req, res))
  );

  router.get(
    '/subjects/:subjectId/data',
    asyncHandler(async (req, res) => subjectsController.requestDataAccess(req, res))
  );

  router.put(
    '/subjects/rectification-requests/:rectificationRequestId',
    updateRectificationStatusValidator,
    asyncHandler(async (req, res) => subjectsController.updateRectificationRequestStatus(req, res))
  );

  router.get(
    '/processors',
    asyncHandler(async (req, res) => processorsController.listProcessors(req, res))
  );

  router.post(
    '/processors',
    addProcessorValidator,
    asyncHandler(async (req, res) => processorsController.addProcessor(req, res))
  );

  router.put(
    '/processors',
    updateProcessorValidator,
    asyncHandler(async (req, res) => processorsController.updateProcessor(req, res))
  );

  router.delete(
    '/processors',
    deleteProcessorValidator,
    asyncHandler(async (req, res) => processorsController.removeProcessors(req, res))
  );

  router.get('/users', asyncHandler(async (req, res) => usersController.listUsers(req, res)));

  router.post(
    '/users',
    usersRegistrationValidator,
    asyncHandler(async (req, res) => usersController.register(req, res))
  );

  router.post(
    '/users/:userId/update-password',
    usersUpdatePasswordValidator,
    asyncHandler(async (req, res) => usersController.updatePassword(req, res))
  );

  router.delete(
    '/users/:userId',
    usersRemovalValidator,
    asyncHandler(async (req, res) => usersController.remove(req, res))
  );

  router.get(
    '/data/attributes-config',
    asyncHandler(async (req, res) => dataController.getAttributesConfig(req, res))
  );

  router.put(
    '/data/attributes-config',
    updateAttributesConfigValidator,
    asyncHandler(async (req, res) => dataController.updateAttributesConfig(req, res))
  );

  router.get('/stats', asyncHandler(async (req, res) => statsController.stats(req, res)));

  router.get('/events', asyncHandler(async (req, res) => statsController.events(req, res)));

  // TEST ROUTES USED ONLY FOR DEVELOPMENT

  router.post(
    '/processors/TEST',
    testAddProcessorValidator,
    asyncHandler(async (req, res) => processorsController.testAddProcessor(req, res))
  );

  router.delete(
    '/processors/TEST',
    testDeleteProcessorsValidator,
    asyncHandler(async (req, res) => processorsController.testRemoveProcessors(req, res))
  );
};
