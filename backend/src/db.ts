import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';

const dbPath = path.join(__dirname, '../../dev.db');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
});

export const Recording = sequelize.define('Recording', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Untitled Recording',
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    thumbnailFilename: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    duration: {
        type: DataTypes.INTEGER, // in seconds
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    watermarkId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
});

export const Watermark = sequelize.define('Watermark', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    position: {
        type: DataTypes.STRING, // 'top-left', 'top-right', 'bottom-left', 'bottom-right', etc.
        allowNull: false,
        defaultValue: 'top-right',
    },
});

Recording.belongsTo(Watermark, { foreignKey: 'watermarkId' });
Watermark.hasMany(Recording, { foreignKey: 'watermarkId' });

export const Folder = sequelize.define('Folder', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

Folder.hasMany(Recording, { foreignKey: 'folderId' });
Recording.belongsTo(Folder, { foreignKey: 'folderId' });

export const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await sequelize.sync({ alter: true });
        console.log('Database synced.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

export default sequelize;
