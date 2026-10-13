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

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];
}