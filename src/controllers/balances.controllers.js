const depositById = async (req, res) => {
    const { sequelize } = require('../model');
    const { Profile, Job, Contract } = req.app.get('models');
    const { userId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity == 'undefined') return res.status(400).end('Quantity not specified');

    const client = await Profile.findOne({
        where: { id: userId }
    });

    if (!client) return res.status(404).end('Client not found');

    const { id } = req.profile;
    const totalUnpaid = await Job.sum('price', {
        where: {
            paid: null
        },
        include: [
            {
                model: Contract,
                where: { status: 'in_progress' },
                include: [
                    {
                        model: Profile,
                        as: 'Client',
                        where: { id }
                    }
                ]
            }
        ]
    });

    const depositLimit = totalUnpaid / 4;

    if (quantity >= depositLimit) return res.status(400).end('Cannot deposit more than 25% your total of jobs to pay');

    await client.increment({ balance: quantity });

    res.json(`Succesfully deposited ${quantity}, current balance: ${client.balance}`);
};

module.exports = { depositById };