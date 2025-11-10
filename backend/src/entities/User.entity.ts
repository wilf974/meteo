import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { Alert } from './Alert.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ default: 'meteorologist' })
  role: string; // 'meteorologist', 'admin', 'analyst'

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    theme?: 'light' | 'dark';
    defaultLayers?: string[];
    notifications?: boolean;
    language?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Alert, alert => alert.user)
  alerts: Alert[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
