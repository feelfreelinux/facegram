import { JsonController, Get, Param, Post, BodyParam, Delete, QueryParam } from 'routing-controllers'
import ChatPlugContext from '../../../ChatPlugContext'
import ThreadConnection from '../../../entity/ThreadConnection'
import { Repository } from 'typeorm'
import Thread from '../../../entity/Thread'
import Service from '../../../entity/Service'
import Message from '../../../entity/Message'

@JsonController('/connections')
export default class ConnectionsController {
  connectionsRepository: Repository<ThreadConnection>
  context: ChatPlugContext
  constructor(context: ChatPlugContext) {
    this.context = context
    this.connectionsRepository = context.connection.getRepository(ThreadConnection)
  }

  @Get('/')
  async getConnections() {
    return this.connectionsRepository.find({ deleted: false })
  }

  @Get('/:id')
  async getConnectionById(@Param('id') id : number) {
    return this.connectionsRepository.findOne({ id })
  }

  @Delete('/:id')
  async deleteConnectionById(@Param('id') id : number) {
    await this.context.connection.createQueryBuilder()
      .update(Thread)
      .set({ deleted: true })
      .where('threadConnection.id = :threadConnection', { threadConnection: id })
      .execute()
    await this.context.connection.createQueryBuilder()
      .update(Message)
      .set({ deleted: true })
      .where('threadConnection.id = :threadConnection', { threadConnection: id })
      .execute()

    return this.connectionsRepository.update({ id }, { deleted: true })
  }

  @Get('/:id/messages')
  async getMessages(
    @Param('id') id : number,
    @QueryParam('after', { required: false }) after: number) {
    if (after) {
      return this.context.connection.getRepository(Message)
        .createQueryBuilder('message')
        .leftJoin('message.threadConnection', 'threadConnection')
        .leftJoinAndSelect('message.attachements', 'attachements')
        .leftJoinAndSelect('message.service', 'service')
        .leftJoinAndSelect('message.author', 'author')
        .orderBy('message.createdAt', 'DESC')
        .where('message.id < :after', { after })
        .andWhere('threadConnection.id = :id', { id })
        // .andWhere('deleted = false')
        .take(25)
        .getMany()
    }
    return this.context.connection.getRepository(Message)
      .createQueryBuilder('message')
      .leftJoin('message.threadConnection', 'threadConnection')
      .leftJoinAndSelect('message.attachements', 'attachements')
      .leftJoinAndSelect('message.author', 'author')
      .leftJoinAndSelect('message.service', 'service')
      .where('threadConnection.id = :id', { id })
      // .andWhere('deleted = false')
      .orderBy('message.createdAt', 'DESC')
      .take(25)
      .getMany()
  }

  @Post('/')
  async createConnection(@BodyParam('connectionName', { required: true }) connectionName : string) {
    const connection = new ThreadConnection()
    connection.connectionName = connectionName
    connection.threads = []
    await this.connectionsRepository.save(connection)
    return connection
  }

  @Post('/:id/threads')
  async createThread(
    @Param('id') connectionId : number,
    @BodyParam('avatarUrl', { required: false, parse: false }) avatarUrl: string,
    @BodyParam('title', { required: true, parse: false }) title: string,
    @BodyParam('subtitle', { required: false }) subtitle: string,
    @BodyParam('externalThreadId', { required: true }) threadId : string,
    @BodyParam('serviceId', { required: true }) instanceId : number) {
    const servicesRepository = this.context.connection.getRepository(Service)
    const threadsRepository = this.context.connection.getRepository(Thread)

    const connection = await this.connectionsRepository.findOneOrFail({ id: connectionId })
    const service = await servicesRepository.findOneOrFail({ id: instanceId })

    const thread = new Thread()
    thread.externalServiceId = threadId
    thread.service = service
    thread.threadConnection = connection
    thread.title = title
    thread.subtitle = subtitle as any
    thread.avatarUrl = avatarUrl || 'https://i.imgur.com/l2QP9Go.png'

    await threadsRepository.save(thread)
    return this.connectionsRepository.findOneOrFail({ id: connectionId })
  }

  @Delete('/:connId/threads/:id')
  async deleteThreadById(
    @Param('connId') connId : number,
    @Param('id') id : number) {
    const threadsRepository = this.context.connection.getRepository(Thread)
    await threadsRepository.update({ id }, { deleted: true })
    const test = await this.context.connection.createQueryBuilder()
      .update(Thread)
      .set({ deleted: true })
      .where('id = :id', { id })
      .execute()
    return this.connectionsRepository.findOneOrFail({ id: connId })
  }
}
