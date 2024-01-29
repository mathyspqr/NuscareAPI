import cors from "cors";
import express from "express";

var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "nurscare",
});

connection.connect(function (err: { stack: string }) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("connected as id " + connection.threadId);
});

const query = async (query: string, params?: any[]): Promise<any> =>
  new Promise((resolve, reject) => {
    connection.query(
      query,
      params,
      (error: any, results: unknown, fields: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });

// on créé une instance d'une application Express
const app = express();

// on précise à l'application qu'elle doit parser le body des requêtes en JSON (utilisation d'un middleware)
app.use(express.json());

const bcrypt = require("bcrypt");
// on peut utiliser app.get, app.post, app.put, app.delete, etc.. ()

// ROUTE POUR RECUP LES USER
app.get(
  "/nurscare",
  async (request: express.Request, result: express.Response) => {
    let todos = await query("Select * from personnel");
    console.log(`route "/nurscare" called`);
    return result.status(200).json(todos);
  }
);

// ROUTE POUR RECUP LES PATIENTS
app.get(
  "/nurscare/patient",
  async (request: express.Request, result: express.Response) => {
    let todos = await query("Select * from patient");
    console.log(`route "/nurscare" called`);
    return result.status(200).json(todos);
  }
);

// ROUTE POUR RECUPERER LES INTERVENTIONS
app.get(
  "/nurscare/agendasinterventions",
  async (request: express.Request, result: express.Response) => {
    try {
      let agendasInterventions = await query(`
        SELECT *
        FROM intervention
      `);

      console.log(`Route "/nurscare/agendasprevisionnels" called`);
      return result.status(200).json({
        message: "Agendas prévisionnels récupérés avec succès",
        agendasInterventions,
      });
    } catch (error) {
      console.error("Error in /nurscare/agendasprevisionnels:", error);
      return result.status(500).json({ message: "Internal server error" });
    }
  }
);

// ROUTE POUR RECUPERER LES INTERVENTIONS D'UN SOIGNANT
app.get(
  "/nurscare/agendasinterventions/:id_personnel",
  async (request: express.Request, result: express.Response) => {
    try {
      const id_personnel = request.params.id_personnel;

      let agendasInterventions = await query(`
        SELECT i.*
        FROM intervention i
        JOIN attribuer a ON i.id_intervention = a.id_intervention
        WHERE a.id_personnel = ?
      `, [id_personnel]);

      console.log(`Route "/nurscare/agendasinterventions" called`);
      return result.status(200).json({
        message: "Agendas interventions récupérés avec succès",
        agendasInterventions,
      });
    } catch (error) {
      console.error("Error in /nurscare/agendasinterventions:", error);
      return result.status(500).json({ message: "Internal server error" });
    }
  }
);

// ROUTE POUR RECUPERER LES PRESTATIONS
app.get(
  "/nurscare/agendasprestations",
  async (request: express.Request, result: express.Response) => {
    try {
      let agendasPrestations = await query(`
      SELECT prestation_de_soin.*, intervention.*, patient.*, personnel.* 
      FROM intervention
      JOIN contenir ON intervention.id_intervention = contenir.id_intervention
      JOIN prestation_de_soin ON contenir.id_prestation = prestation_de_soin.id_prestation
      JOIN patient ON intervention.id_patient = patient.id_patient
      JOIN realiser ON prestation_de_soin.id_prestation = realiser.id_prestation
      JOIN personnel ON realiser.id_personnel = personnel.id_personnel;
      `);

      console.log(`Route "/nurscare/agendasprevisionnels" called`);
      return result.status(200).json({
        message: "Agendas prévisionnels récupérés avec succès",
        agendasPrestations,
      });
    } catch (error) {
      console.error("Error in /nurscare/agendasprevisionnels:", error);
      return result.status(500).json({ message: "Internal server error" });
    }
  }
);

app.get(
  "/nurscare/agendasprestationsall",
  async (request: express.Request, result: express.Response) => {
    try {
      let agendasPrestations = await query(`
      SELECT * from prestation_de_soin
      `);

      console.log(`Route "/nurscare/agendasprevisionnels" called`);
      return result.status(200).json({
        message: "Agendas prévisionnels récupérés avec succès",
        agendasPrestations,
      });
    } catch (error) {
      console.error("Error in /nurscare/agendasprevisionnels:", error);
      return result.status(500).json({ message: "Internal server error" });
    }
  }
);



// ROUTE POUR RECUP UN USER
app.get("/nurscare/:id_personnel", async (request, response) => {
  const idPersonnel = request.params.id_personnel;
  if (!/^\d+$/.test(idPersonnel)) {
    return response.status(400).send("Invalid ID");
  }
  try {
    let queryResult = await query(
      "SELECT * FROM personnel WHERE id_personnel = ?",
      [idPersonnel]
    );

    if (queryResult.length === 0) {
      return response.status(404).send("Personnel not found");
    }
    console.log(`Route "/nurscare/${idPersonnel}" called`);
    return response.status(200).json(queryResult[0]);
  } catch (error) {
    console.error("Error:", error);
    return response.status(500).send("Internal Server Error");
  }
});

// ROUTE POUR CREER UN USER
app.post("/nurscare/createaccount", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await query(
      `INSERT INTO personnel (email_personnel , mdp_personnel) VALUES ('${email}', '${hashedPassword}')`
    );
    console.log(`Nouveau compte creer pour ${email}`);
    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    console.error("Error in /createaccount:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ROUTE POUR CREER UN PATIENT
app.post("/nurscare/createpatient", async (req, res) => {
  try {
    const {
      nom_patient,
      prenom_patient,
      email_patient,
      adresse_patient,
      datenaissance_patient,
    } = req.body;

    if (
      !nom_patient ||
      !prenom_patient ||
      !email_patient ||
      !adresse_patient ||
      !datenaissance_patient
    ) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    await query(
      `INSERT INTO patient (nom_patient, prenom_patient, email_patient, adresse_patient, datenaissance_patient) VALUES (?, ?, ?, ?, ?)`,
      [
        nom_patient,
        prenom_patient,
        email_patient,
        adresse_patient,
        datenaissance_patient,
      ]
    );
    console.log(`Nouveau patient créé : ${nom_patient} ${prenom_patient}`);
    res.status(201).json({ message: "Patient créé avec succès" });
  } catch (error) {
    console.error("Erreur dans /nurscare/createpatient:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ROUTE POUR DELETE UN PATIENT
app.delete("/nurscare/deletepatient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ message: "L'ID du patient est requis" });
    }
    const result = await query(`DELETE FROM patient WHERE id_patient = ?`, [
      patientId,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Patient non trouvé" });
    }
    console.log(`Patient supprimé : ID ${patientId}`);
    res.status(200).json({ message: "Patient supprimé avec succès" });
  } catch (error) {
    console.error("Erreur dans /nurscare/deletepatient:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ROUTE POUR MODIFIER UN PATIENT
app.put("/nurscare/updatepatient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      nom_patient,
      prenom_patient,
      email_patient,
      adresse_patient,
      datenaissance_patient,
    } = req.body;
    if (
      !nom_patient ||
      !prenom_patient ||
      !email_patient ||
      !adresse_patient ||
      !datenaissance_patient
    ) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }
    const result = await query(
      `UPDATE patient SET nom_patient = ?, prenom_patient = ?, email_patient = ?, adresse_patient = ?, datenaissance_patient = ? WHERE id_patient = ?`,
      [
        nom_patient,
        prenom_patient,
        email_patient,
        adresse_patient,
        datenaissance_patient,
        patientId,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Patient non trouvé" });
    }
    console.log(`Patient mis à jour : ID ${patientId} avec comme mise à jour ${nom_patient}, ${prenom_patient}, ${email_patient}, ${adresse_patient}, ${datenaissance_patient}`);
    res.status(200).json({ message: "Patient mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur dans /nurscare/updatepatient:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});


// ROUTE POUR LOGIN UN USER
app.post("/nurscare/loginaccount", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const users = await query(
      "SELECT * FROM personnel WHERE email_personnel = ?",
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.mdp_personnel);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.status(200).json({
      message: "Login successful",
      user: {
        id_personnel: user.id_personnel,
        email_personnel: user.email_personnel,
        nom_personnel: user.nom_personnel,
        prenom_personnel: user.prenom_personnel,
        adresse_personnel: user.adresse_personnel,
        date_naissance_personnel: user.date_naissance_personnel,
        role_personnel: user.id_role
      },
    });
  } catch (error) {
    console.error("Error in /loginaccount:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ROUTE POUR MODIF INFO USER
app.post("/nurscare/submitform", async (req, res) => {
  try {
    const {
      Email,
      nom_personnel,
      prenom_personnel,
      date_naissance_personnel,
      adresse_personnel,
      id_role,
      id_personnel,
    } = req.body;
    console.log("Received form data:", req.body);

    let updateParts = [];
    let values = [];

    if (Email) {
      updateParts.push("email_personnel = ?");
      values.push(Email);
    }

    if (id_role) {
      // Supprimer tous les rôles existants pour cet utilisateur dans les tables spécifiques
      const deleteAdminQuery = `DELETE FROM administratif WHERE id_personnel = ?`;
      await query(deleteAdminQuery, [id_personnel]);
    
      const deleteSoignantQuery = `DELETE FROM soignant WHERE id_personnel = ?`;
      await query(deleteSoignantQuery, [id_personnel]);
    
      const deleteDirecteurQuery = `DELETE FROM directeur WHERE id_personnel = ?`;
      await query(deleteDirecteurQuery, [id_personnel]);
    
      const deleteStagiaireQuery = `DELETE FROM stagiaire WHERE id_personnel = ?`;
      await query(deleteStagiaireQuery, [id_personnel]);
    
      // Ajouter le nouveau rôle
      if (id_role === 1 || id_role === 2 || id_role === 3 || id_role === 4) {
        const insertQuery = `INSERT INTO ${
          id_role === 1
            ? "stagiaire"
            : id_role === 2
            ? "directeur"
            : id_role === 3
            ? "administratif"
            : id_role === 4
            ? "soignant"
            : ""
        } (id_personnel) VALUES (?)`;
        await query(insertQuery, [id_personnel]);
      }
    
      updateParts.push("id_role = ?");
      values.push(id_role);
    }    

    if (nom_personnel) {
      updateParts.push("nom_personnel = ?");
      values.push(nom_personnel);
    }
    if (prenom_personnel) {
      updateParts.push("prenom_personnel = ?");
      values.push(prenom_personnel);
    }
    if (date_naissance_personnel) {
      updateParts.push("date_naissance_personnel = ?");
      values.push(date_naissance_personnel);
    }
    if (adresse_personnel) {
      updateParts.push("adresse_personnel = ?");
      values.push(adresse_personnel);
    }

    // Assurez-vous qu'il y a des champs à mettre à jour
    if (updateParts.length === 0 || !id_personnel) {
      return res
        .status(400)
        .json({ message: "No fields to update or ID missing" });
    }

    const updateQuery = `UPDATE personnel SET ${updateParts.join(
      ", "
    )} WHERE id_personnel = ?`;
    values.push(id_personnel);

    const result = await query(updateQuery, values);
    console.log("Update result:", result);

    if (result.affectedRows === 0) {
      console.log(`No records found with id_personnel = ${id_personnel}`);
      return res.status(404).json({ message: "Record not found" });
    }

    console.log(`Form data updated for ${Email}`);
    res.status(200).json({ message: "Form data successfully updated" });
  } catch (error) {
    console.error("Error in /submitform:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.post('/nurscare/addintervention', async (req, res) => {
  try {
    const formData = req.body;

    // 1. Insérer l'intervention
    const resultIntervention = await query(`
      INSERT INTO intervention (libelle_intervention, date_intervention_debut, date_intervention_fin, id_patient)
      VALUES (?, ?, ?, ?)
    `, [formData.text, formData.startDate, formData.endDate, formData.id_patient]);

    const idIntervention = resultIntervention.insertId;

    // 2. Insérer l'attribution
    const resultAttribution = await query(`
      INSERT INTO attribuer (id_intervention, id_personnel)
      VALUES (?, ?)
    `, [idIntervention, formData.id_personnel]);

    // 3. Insérer chaque id_prestation dans la table realiser et contenir
    for (const idPrestation of formData.id_prestations) {
      // 3.1. Insérer dans la table realiser
      const resultRealiser = await query(`
        INSERT INTO realiser (id_prestation, id_personnel)
        VALUES (?, ?)
      `, [idPrestation, formData.id_personnel]);

      // 3.2. Insérer dans la table contenir
      const resultContenir = await query(`
        INSERT INTO contenir (id_prestation, id_intervention)
        VALUES (?, ?)
      `, [idPrestation, idIntervention]);
    }

    console.log('Intervention, attribution, realiser, and contenir added successfully');
    res.status(201).json({ message: 'Intervention, attribution, realiser, and contenir added successfully', resultIntervention, resultAttribution });
  } catch (error) {
    console.error('Error adding intervention, attribution, realiser, and contenir:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//DELETE UNE INTERVENTION
app.delete("/nurscare/deleteintervention/:id_intervention", async (req, res) => {
  try {
    const { id_intervention } = req.params;
    if (!id_intervention) {
      return res.status(400).json({ message: "L'ID de l'intervention est requis" });
    }

    // 1. Supprimer les entrées dans la table contenir liées à l'id_intervention
    const resultContenir = await query(
      `DELETE FROM contenir WHERE id_intervention = ?`,
      [id_intervention]
    );

    // 2. Vérifier si des entrées ont été supprimées de la table contenir
    if (resultContenir.affectedRows > 0) {
      console.log(`Entrées de la table de jointure supprimées pour l'id_intervention ${id_intervention}`);
    }

    // 3. Supprimer l'entrée dans la table attribuer liée à l'id_intervention
    const resultAttribuer = await query(
      `DELETE FROM attribuer WHERE id_intervention = ?`,
      [id_intervention]
    );

    // 4. Supprimer l'entrée dans la table intervention
    const resultIntervention = await query(
      `DELETE FROM intervention WHERE id_intervention = ?`,
      [id_intervention]
    );

    // 5. Vérifier si une intervention a été supprimée
    if (resultIntervention.affectedRows === 0) {
      return res.status(404).json({ message: "Intervention non trouvée" });
    }

    console.log(`Intervention supprimée : ID ${id_intervention}`);
    res.status(200).json({ message: "Intervention supprimée avec succès" });
  } catch (error) {
    console.error("Erreur dans /nurscare/deleteintervention:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});



// ROUTE POUR SUPPRIMER UNE PRESTATION
app.delete('/nurscare/deleteprestation/:idPrestation', async (req, res) => {
  try {
    const idPrestation = req.params.idPrestation;

    await query('DELETE FROM realiser WHERE id_prestation = ?', [idPrestation]);

    await query('DELETE FROM contenir WHERE id_prestation = ?', [idPrestation]);

    const resultPrestation = await query('DELETE FROM prestation_de_soin WHERE id_prestation = ?', [idPrestation]);

    console.log('Prestation de soin supprimée avec succès');
    res.status(200).json({
      message: 'Prestation de soin supprimée avec succès',
      resultPrestation
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la prestation de soin :', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});


//ROUTE POUR RECUPERER L'ITINERAIRE VIA L'API GITHUB
app.post('/nurscare/calculate-routes', async (req, res) => {
  try {
    const { adresseInfo, startingPoint } = req.body;

    if (!adresseInfo || !startingPoint) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const result = await computeRoutes(adresseInfo, startingPoint);

    res.json(result);
  } catch (error) {
    console.error('Error while calculating routes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//API GITHUB ITINERAIRE
import "dotenv/config";
const googleDirectionsAPIURL =
   "https://routes.googleapis.com/directions/v2:computeRoutes";
const APIKey = process.env.GOOGLE_MAP_API_KEY || "AIzaSyC6aoXl4XsKf8pHYAXD-SGcxZVO0D7R33c";
/**
 * technical function to mimick latency from network in mock mode
 * @param {number} time the miliseconds to wait
 * @returns {Promise<void>} a promise that resolves after `time`ms
 */
const delay = (time: number) =>
   new Promise((resolve) => setTimeout(resolve, time));

/**
 * Function able to call Google Map API
 * @param {string[]} adresses an array of adresses (e.g. "1 rue de l'exemple, 75000 Paris"). Addresses must be in France.
 * @param {string} startingPoint a starting point for the trip (following same formalism than `adresses` param)
 * @returns {Promise<{orderedAddresses: string[], encodedPolyline: string}>} Promise of an object with the list of the adresses ordered to optimize duration of transit, and encoded polyline that cna be injected inside a google Maps widget to display track
 */
const computeRoutes = async (adresses: string[], startingPoint: string) => {
   let result;
   const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
   const now = new Date(Date.now() - tzoffset);

   if (APIKey.length) {
      const requestBody = {
         origin: {
            address: startingPoint,
         },
         destination: {
            address: startingPoint,
         },
         intermediates: adresses.map((a) => ({ address: a })),
         regionCode: "fr",
         travelMode: "DRIVE",
         routingPreference: "TRAFFIC_AWARE",
         departureTime: now.toISOString(),
         computeAlternativeRoutes: false,
         routeModifiers: {
            avoidTolls: true,
            avoidHighways: false,
            avoidFerries: false,
         },
         optimizeWaypointOrder: "true",
         languageCode: "fr-FR",
         units: "METRIC",
      };

      const response = await fetch(googleDirectionsAPIURL, {
         method: "POST",
         body: JSON.stringify(requestBody),
         headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": APIKey,
            "X-Goog-FieldMask":
               "routes.optimizedIntermediateWaypointIndex,routes.polyline",
         },
      });

      const gMapsResult =
         (await response.json()) as google.maps.DirectionsResult & {
            error: unknown;
         };
      if (gMapsResult.error) {
         console.log(
            "Error while retrieving result",
            JSON.stringify(gMapsResult.error),
         );
         result = null;
      } else {
         const { routes } = gMapsResult;
         result = {
            // ugly casts to get the properties that i need (dunno why the types are out of date, might be doing smth wrong)
            orderedAddresses: (
               routes[0] as unknown as {
                  optimizedIntermediateWaypointIndex: number[];
               }
            ).optimizedIntermediateWaypointIndex.map(
               (i: number) => adresses[i],
            ),
            encodedPolyline: (
               routes[0] as unknown as { polyline: { encodedPolyline: string } }
            ).polyline.encodedPolyline,
         };
      }
   } else {
      console.log(
         "No Google Map API Key found in GOOGLE_MAP_API_KEY environement variable, using mock random mode",
      );
      result = {
         orderedAddresses: adresses.sort(
            () => Math.floor(Math.random() * 2) - 1,
         ),
         encodedPolyline: null, // not available on mocked data
      };
   }
   await delay(1500);
   return result;
};

// ROUTE POUR MODIFIER UNE INTERVENTION
app.put("/nurscare/updateintervention/:id_intervention", async (req, res) => {
  try {
    const { id_intervention } = req.params;
    const { text, startDate, endDate, id_patient } = req.body;

    const existingIntervention = await query('SELECT * FROM intervention WHERE id_intervention = ?', [id_intervention]);

    if (!existingIntervention || existingIntervention.length === 0) {
      return res.status(404).json({ message: "Intervention non trouvée" });
    }

    let updateQuery = 'UPDATE intervention SET';
    const updateValues = [];

    if (text) {
      updateQuery += ' libelle_intervention = ?,';
      updateValues.push(text);
    }

    if (startDate) {
      updateQuery += ' date_intervention_debut = ?,';
      updateValues.push(new Date(startDate));
    }

    if (endDate) {
      updateQuery += ' date_intervention_fin = ?,';
      updateValues.push(new Date(endDate));
    }

    if (id_patient) {
      updateQuery += ' id_patient = ?,';
      updateValues.push(id_patient);
    }

    updateQuery = updateQuery.slice(0, -1);

    updateQuery += ' WHERE id_intervention = ?';
    updateValues.push(id_intervention);

    const resultIntervention = await query(updateQuery, updateValues);

    console.log(`Intervention mise à jour avec succès : ID ${id_intervention}`);
    res.status(200).json({ message: "Intervention mise à jour avec succès", resultIntervention });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'intervention:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});



// ROUTE POUR DELETE UNE INTERVENTION

export { computeRoutes };




app.listen(8080, () => console.log("server started, listening on port 8080"));
