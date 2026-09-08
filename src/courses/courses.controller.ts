import { Controller, Get, Param, Post, Query, Body, Delete, Patch } from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { title } from 'process';

@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) {}

    @Get()
    findAll(@Query('level') level?: string) {
        return this.coursesService.findAll(level);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.coursesService.findOne(Number(id));
    }

    @Post()
    create(@Body() body:{title: string, level: string}) {
        return this.coursesService.create(body);
    }

    

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() body: {title?: string, level?: string}
    )   {
            return this.coursesService.update(Number(id), body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.coursesService.remove(Number(id));
    }


}
