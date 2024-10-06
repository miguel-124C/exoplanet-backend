
import express from 'express';
import cors from 'cors';

const app = express();
const port = 3000;

// Habilitar CORS para todas las rutas
app.use(cors());

// Middleware para manejar datos en formato JSON
app.use(express.json());

const baseUrl = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const format = 'JSON';

// Rutas

// Ejemplo de ruta GET
app.get('/list_hostname', async(req, res) => {
    const query = `select+distinct+hostname+from+ps+where+upper(soltype)+like+'%CONF%'+and+upper(hostname)+like+'%E%'+order+by+hostname`;

    try {
        const response = await fetch(`${baseUrl}?query=${query}&format=${format}`);
        
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.statusText}`);
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error al conectar con la OTA:', error.message);
        res.status(500).json({ error: 'Error al conectar con la OTA' });
    }
});

app.get('/search_system', async(req, res) => {
    const { hostname } = req.query;
    const columns = 'hostname,pl_name,dec,ra,pl_orbsmax,rowupdate,st_age,pl_rade,pl_masse,pl_dens,pl_orbincl,pl_orbper';
    const where = `upper(soltype)+like+'%CONF%'+and+hostname+=+'${hostname}'`;
    const query = `select+${columns}+from+ps+where+${where}`;

    try {
        const response = await fetch(`${baseUrl}?query=${query}&format=${format}`);
        
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.statusText}`);
        }
        
        const data = await response.json();
        // Crear un mapa para almacenar el planeta más reciente de cada pl_name
        const planetMap = {};

        data.forEach(planet => {
        const current = planetMap[planet.pl_name];
        if (!current || new Date(planet.rowupdate) > new Date(current.rowupdate)) {
            planetMap[planet.pl_name] = planet;
        }
        });

        // Convertir el mapa a un array de planetas sin duplicados y con las fechas más recientes
        const uniquePlanets = Object.values(planetMap);
        console.log(uniquePlanets);
        // Enviar el array al frontend
        res.json(uniquePlanets);
    } catch (error) {
        console.error('Error al conectar con la OTA:', error.message);
        res.status(500).json({ error: 'Error al conectar con la OTA' });
    }
});

// Servidor escuchando
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
