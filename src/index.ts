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
    // Envoi de toutes les informations de l'utilisateur (sauf le mot de passe)
    res.status(200).json({
      message: "Login successful",
      user: {
        id_personnel: user.id_personnel,
        email_personnel: user.email_personnel,
        nom_personnel: user.nom_personnel,
        prenom_personnel: user.prenom_personnel,
        adresse_personnel: user.adresse_personnel,
        date_naissance_personnel: user.date_naissance_personnel,
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

app.listen(8080, () => console.log("server started, listening on port 8080"));
