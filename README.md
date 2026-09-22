<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Courses API

CourseHub administra cursos temporalmente en memoria. Los cuerpos de creación
y actualización se validan antes de llegar al servicio.

| Método | Ruta | Resultado |
| --- | --- | --- |
| `GET` | `/courses` | Lista los cursos; admite el filtro opcional `level`. |
| `GET` | `/courses/:id` | Devuelve el curso (`200`) o `404` si no existe. |
| `POST` | `/courses` | Crea un curso (`201`) o rechaza un cuerpo inválido (`400`). |
| `PATCH` | `/courses/:id` | Actualiza solo los campos enviados (`200`), o responde `400`/`404`. |
| `DELETE` | `/courses/:id` | Elimina y devuelve el curso (`200`), o responde `404`. |

`POST /courses` requiere un `title` de texto no vacío y un `level` con uno de
estos valores: `beginner`, `intermediate` o `advanced`.

Petición válida, respuesta `201 Created`:

```json
{
  "title": "Diseño de APIs",
  "level": "intermediate"
}
```

Un título vacío o nivel no permitido responde `400 Bad Request`:

```json
{
  "title": "",
  "level": "expert"
}
```

Las propiedades no declaradas también responden `400 Bad Request`:

```json
{
  "title": "Diseño de APIs",
  "level": "intermediate",
  "duration": 20
}
```

`PATCH /courses/:id` acepta los mismos campos de forma opcional. Por ejemplo,
esta petición cambia solo el nivel y mantiene el título:

```json
{
  "level": "advanced"
}
```

Los cursos se almacenan en un arreglo en memoria, por lo que se reinician al
reiniciar la API.

## Students API

CourseHub tambien administra estudiantes en memoria. Los cuerpos de creacion y
actualizacion se validan antes de llegar al servicio.

| Metodo | Ruta | Resultado |
| --- | --- | --- |
| `GET` | `/students` | Lista estudiantes; admite `career`, `semester` e `isActive`. |
| `GET` | `/students/:id` | Devuelve un estudiante o `404` si no existe. |
| `POST` | `/students` | Crea un estudiante validando los datos y el correo unico. |
| `PATCH` | `/students/:id` | Actualiza los campos enviados. |
| `PATCH` | `/students/:id/status` | Cambia el estado activo del estudiante. |
| `DELETE` | `/students/:id` | Elimina un estudiante activo. |

## Enrollments API

Las matriculas se mantienen temporalmente en memoria con `id`, `studentId` y
`courseId`. Todos los cuerpos y query strings usan el `ValidationPipe` global
con `whitelist` y `forbidNonWhitelisted`; los identificadores de estudiante se
validan con `ParseStudentIdPipe` y los demas identificadores con `ParseIntPipe`.

| Metodo | Ruta | Resultado |
| --- | --- | --- |
| `POST` | `/enrollments` | Crea una matricula (`201`). |
| `GET` | `/enrollments` | Lista matriculas; admite `studentId` y `courseId` combinables. |
| `GET` | `/students/:studentId/enrollments` | Lista las matriculas de un estudiante existente. |
| `GET` | `/courses/:courseId/enrollments` | Lista las matriculas de un curso existente. |
| `DELETE` | `/enrollments/:id` | Cancela y devuelve la matricula (`200`). |

### Demonstration

Los siguientes pasos deben ejecutarse en una misma ejecucion de la API, ya que
la informacion se reinicia al detener el servidor.

Primero, cree un estudiante activo:

```http
POST /students
Content-Type: application/json

{
  "name": "Ana Perez",
  "email": "ana.perez@example.com",
  "age": 20,
  "career": "Ingenieria de Software",
  "semester": 8,
  "isActive": true
}
```

Respuesta `201 Created`:

```json
{
  "id": 1,
  "name": "Ana Perez",
  "email": "ana.perez@example.com",
  "age": 20,
  "career": "Ingenieria de Software",
  "semester": 8,
  "isActive": true
}
```

Matricula valida en el curso inicial `1`:

```http
POST /enrollments
Content-Type: application/json

{
  "studentId": 1,
  "courseId": 1
}
```

```json
{
  "id": 1,
  "studentId": 1,
  "courseId": 1
}
```

Repetir el mismo `POST /enrollments` responde `409 Conflict` porque la
combinacion `studentId` y `courseId` ya existe. Un identificador inexistente,
por ejemplo `{ "studentId": 999, "courseId": 1 }`, responde `404 Not Found`.

Para demostrar un estudiante inactivo, cambie su estado y vuelva a intentar la
matricula:

```http
PATCH /students/1/status
Content-Type: application/json

{ "isActive": false }
```

```http
POST /enrollments
Content-Type: application/json

{ "studentId": 1, "courseId": 2 }
```

La segunda solicitud responde `409 Conflict` con el mensaje
`Inactive students cannot be enrolled`.

Active de nuevo al estudiante, cree la matricula del curso `2` y consulte los
filtros combinables:

```http
GET /enrollments?studentId=1&courseId=2
GET /students/1/enrollments
GET /courses/2/enrollments
DELETE /enrollments/2
```

El `GET /enrollments?studentId=1&courseId=2` devuelve solamente la matricula
coincidente y `DELETE /enrollments/2` responde `200 OK` con la matricula
cancelada. Una segunda cancelacion del mismo identificador responde `404 Not
Found`.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
