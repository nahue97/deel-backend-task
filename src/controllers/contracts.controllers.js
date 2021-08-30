const getAll = async (req, res) => {
    const { Op } = require("sequelize");
    const { Contract } = req.app.get('models');
    const { id, type } = req.profile;

    const whereClause = {
        [Op.not]: [
            { status: 'terminated' }
        ]
    };

    if (type == 'client') {
        whereClause.ClientId = id;
    } else {
        whereClause.ContractorId = id;
    }

    const contracts = await Contract.findAll({ where: whereClause });
    res.json(contracts);
};

const getById = async (req, res) => {
    const { Contract } = req.app.get('models');
    const userId = req.profile.id;
    const type = req.profile.type;
    const { id } = req.params;

    const whereClause = { id };
    if (type == 'client') {
        whereClause.ClientId = userId;
    } else {
        whereClause.ContractorId = userId;
    }

    const contract = await Contract.findOne({ where: whereClause });
    if (!contract) return res.status(404).end('Contract not found');
    res.json(contract);
};

module.exports = { getAll, getById };