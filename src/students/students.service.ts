import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { FindStudentsQueryDto } from './dto/find-students-query.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto.js';

type Student = {
  id: number;
  name: string;
  email: string;
  age: number;
  career: string;
  semester: number;
  isActive: boolean;
};

@Injectable()
export class StudentsService {
  private nextId = 1;
  private students: Student[] = [];

  findAll(filters: FindStudentsQueryDto): Student[] {
    return this.students.filter((student) => {
      const matchesCareer =
        !filters.career || student.career === filters.career;
      const matchesSemester =
        !filters.semester || student.semester === Number(filters.semester);
      const matchesStatus =
        !filters.isActive || student.isActive === (filters.isActive === 'true');

      return matchesCareer && matchesSemester && matchesStatus;
    });
  }

  findOne(id: number): Student {
    const student = this.students.find((item) => item.id === id);

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} was not found`);
    }

    return student;
  }

  create(createStudentDto: CreateStudentDto): Student {
    this.ensureEmailIsAvailable(createStudentDto.email);

    const student: Student = {
      id: this.nextId++,
      ...createStudentDto,
    };

    this.students.push(student);
    return student;
  }

  update(id: number, updateStudentDto: UpdateStudentDto): Student {
    const student = this.findOne(id);

    if (updateStudentDto.email && updateStudentDto.email !== student.email) {
      this.ensureEmailIsAvailable(updateStudentDto.email, student.id);
    }

    Object.assign(student, updateStudentDto);
    return student;
  }

  updateStatus(
    id: number,
    updateStudentStatusDto: UpdateStudentStatusDto,
  ): Student {
    const student = this.findOne(id);
    student.isActive = updateStudentStatusDto.isActive;
    return student;
  }

  remove(id: number): Student {
    const student = this.findOne(id);

    if (!student.isActive) {
      throw new ConflictException('Inactive students cannot be deleted');
    }

    const index = this.students.indexOf(student);
    this.students.splice(index, 1);
    return student;
  }

  private ensureEmailIsAvailable(email: string, studentId?: number): void {
    const emailInUse = this.students.some(
      (student) =>
        student.email.toLowerCase() === email.toLowerCase() &&
        student.id !== studentId,
    );

    if (emailInUse) {
      throw new ConflictException('A student with this email already exists');
    }
  }
}