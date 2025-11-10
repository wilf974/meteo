import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User.entity';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  conditions: {
    parameters: Array<{
      type: string; // 'temperature', 'wind', 'precipitation', etc.
      operator: string; // '>', '<', '>=', '<=', '==', '!='
      value: number;
      unit: string;
    }>;
    logic: 'AND' | 'OR';
  };

  @Column({ type: 'jsonb', nullable: true })
  zone: {
    type: 'circle' | 'polygon';
    coordinates: number[][];
    radius?: number;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: { email: true, push: false, sms: false } })
  notificationChannels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  @Column({ type: 'timestamp', nullable: true })
  lastTriggered: Date;

  @ManyToOne(() => User, user => user.alerts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
