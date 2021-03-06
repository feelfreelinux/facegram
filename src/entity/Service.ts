import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm'
import User from './User'
import Thread from './Thread'
import { IChatPlugServiceStatus } from '../models'
import Log from './Log'

@Entity()
export default class Service {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ default: false })
  deleted: boolean

  @Column()
  instanceName: string

  @Column()
  moduleName: string

  @Column({ default: IChatPlugServiceStatus.SHUTDOWN })
  status: string

  @Column()
  enabled: boolean

  @Column()
  primaryMode: boolean

  @ManyToMany(type => Service, { cascade: true })
  @JoinTable()
  primaryIgnoredServices: Service[]

  @Column()
  configured: boolean

  @OneToMany(type => Thread, thread => thread.service, {  onDelete: 'CASCADE', cascade: ['insert', 'remove', 'update'] })
  threads: Thread[]

  @OneToMany(type => Log, log => log.service, { onDelete: 'CASCADE', cascade: ['insert', 'remove', 'update'] })
  @JoinTable()
  logs: Log[]

  @OneToMany(type => User, user => user.service, { cascade: ['insert', 'remove', 'update'] })
  @JoinTable()
  users: User[]
}
