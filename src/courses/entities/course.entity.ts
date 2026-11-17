import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'; // 1
import { Enrollment } from '../../enrollments/entiti/enrollment.entity.js';

@Entity('courses') // 2
export class Course { // 3
  @PrimaryGeneratedColumn() // 4
  id: number;

  @Column() // 5
  title: string;

  @Column() // 6
  level: string;

  @Column({ name: 'created_by_user_id', type: 'int', nullable: true })
  createdByUserId: number | null;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];
}