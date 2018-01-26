module.exports = (sequelize, DataTypes) => {
  // A client is a person or business that is going to be charged for work that is performed and
  // tracked. More generally a client represents a group of projects that time is being tracked
  // against. This could include an "Internal" client for tracking vacations, etc.
  const Client = sequelize.define('Client', {
    // The name of the client. This name will be displayed on invoices.
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    // The address of the client. This address will be displayed on the invoices for mailing
    // purposes.
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // A free format note field. The content of this field will not be displayed to the client.
    notes: {
      type: DataTypes.TEXT,
    },
    // An archived client will not be displayed in the application by default. A client should be
    // archived once all projects with that client are complete. An archived client can be
    // unarchived.
    archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });

  return Client;
};
