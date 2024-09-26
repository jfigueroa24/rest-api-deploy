const express = require('express')
const movies = require('./movies.json')
const crypto = require('node:crypto')
const { validateMovie, validatePartialMovie } = require('./schema/movies')
const cors = require('cors')

// METHODS COMMONS: GET/HEAD/POST
// METHODS HARD: PUT/PATCH/DELETE

// CORE PRE-Flight
// OPTIONS

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:8080',
        'http://localhost:3000',
        'http://movies.com',
        'http://midu.dev',
      ]

      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true)
      }

      if (!origin) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
  })
)
app.disable('x-powered-by')

// TODOS LOS RECURSOS QUE SEAN MOVIES SE IDENTIFICA CON /MOVIES

//LIST MOVIE

app.get('/movies', (req, res) => {
  const { genre, year, duration } = req.query
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  if (year) {
    const filteredMovies = movies.filter(
      (movie) => movie.year === parseInt(year)
    )
    return res.json(filteredMovies)
  }

  if (duration) {
    const filteredMovies = movies.filter(
      (movie) => movie.duration === parseInt(duration)
    )
    return res.json(filteredMovies)
  }

  res.json(movies)
})

//CREATE MOVIE

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)
  if (result.error) {
    // 422 Unprocessable Entity
    res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(), //Crea un nuevo ID v4
    ...result.data,
  }

  // Esto no seria REST, porque se esta guardando
  // el estado de la aplicacion en memoria
  movies.push(newMovie)
  res.status(201).json(newMovie) // actualiza la caché del cliente
})

//DELETE MOVIE

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie Not Found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

//UPDATE MOVIE

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie Not Found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

//LIST MOVIE for ID

app.get('/movies/:id', (req, res) => {
  //path-to-regexp
  const { id } = req.params

  const movie = movies.find((movie) => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie Not Found' })
})

//CREATE OPTIONS

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  }
  res.send(200)
})

//CREATE LISTEN SERVER

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server listening in http://localhost:${PORT}`)
})
