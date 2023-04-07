"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);  //why not NotFoundError?
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get customer by name
   * return any customers with names that contain search query */

  static async getByName(name) {
    const results = await db.query(
      `SELECT id,
          first_name AS "firstName",
          last_name  AS "lastName",
          phone,
          notes
        FROM customers
        WHERE CONCAT(first_name, ' ', last_name) ILIKE '%' || $1 || '%'`,
        //can order by lastName
      [name]  //could add % around name using string interpolation
    );

    return results.rows.map(c => new Customer(c));
  }

  /** return top 10 customers by reservation count */

  static async getTop10() {
    const results = await db.query(
      `SELECT customers.id,
          first_name AS "firstName",
          last_name  AS "lastName",
          phone,
          customers.notes AS notes,
          COUNT(*) as num_reservations
      FROM customers
        INNER JOIN reservations
          ON customers.id = reservations.customer_id
      GROUP BY customers.id
      ORDER BY num_reservations DESC
      LIMIT 10`
    )
    // loop through all results.rows:
    // const {firstName, lastName, phone, notes} = c;
    // c = {firstName, lastName, phone, notes};

    return results.rows.map(c => new Customer(c));
  }


  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers(first_name, last_name, phone, notes)
             VALUES($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name = $1,
      last_name = $2,
      phone = $3,
      notes = $4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** get full name of single customer */
  fullName() {
    return `${ this.firstName } ${ this.lastName }`;
  }
}

module.exports = Customer;;
