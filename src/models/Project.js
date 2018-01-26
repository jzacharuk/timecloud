module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    referenceNumber: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    archived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  });

  Project.associate = (models) => {
    // models.Project.belongsToMany(models.Task, { through: 'projectTask' });
    models.Project.belongsTo(models.Client);
  };

  return Project;
};
