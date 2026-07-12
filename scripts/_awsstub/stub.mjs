/* Fake @aws-sdk surface. Every @aws-sdk/* import is redirected here by loader.mjs.
   Command classes just capture their input; the document client's send() defers
   to globalThis.__ddb(cmd) so a test can script responses. SES/Lambda are no-ops. */
class Base { constructor(input) { this.input = input; } }
export class GetCommand extends Base {}
export class UpdateCommand extends Base {}
export class QueryCommand extends Base {}
export class ScanCommand extends Base {}
export class PutCommand extends Base {}
export class DeleteCommand extends Base {}
export class TransactWriteCommand extends Base {}
export class BatchGetCommand extends Base {}

export class DynamoDBClient { constructor() {} }
export const DynamoDBDocumentClient = {
  from() {
    return { send: (cmd) => (globalThis.__ddb ? globalThis.__ddb(cmd) : Promise.resolve({})) };
  },
};

export class SESClient { send() { return Promise.resolve({}); } }
export class SendEmailCommand extends Base {}
export class LambdaClient { send() { return Promise.resolve({}); } }
export class InvokeCommand extends Base {}
