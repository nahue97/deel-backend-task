const getBestProfession = async (req, res) => {
    const { Op } = require("sequelize");
    const { Contract, Profile, Job } = req.app.get('models');
    const { start, end } = req.query;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate == 'Invalid Date' || endDate == 'Invalid Date') return res.status(500).end('Start and end must be valid dates specified in YYYY-MM-DD format');

    // I assume that a job was performed in the specified period if its createdAt is inside the period
    const paidJobsForPeriod = await Job.findAll({
        where: {
            paid: true,
            [Op.or]: [
                {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                {
                    updatedAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            ]
        },
        include: [
            {
                model: Contract,
                include: [
                    {
                        model: Profile,
                        as: 'Contractor',
                        where: { type: 'contractor' }
                    }
                ]
            }
        ]
    });

    if (paidJobsForPeriod.length == 0) return res.status(404).end('No paid jobs performed in that period of time');

    const earnedMoneyPerProfession = paidJobsForPeriod.reduce((result, job) => {
        const profession = job.Contract.Contractor.profession;
        if (typeof result[profession] == 'undefined') {
            result[profession] = job.price;
        } else {
            result[profession] += job.price;
        }
        return result;
    }, {});

    const bestProfessionWithMoney = Object.entries(earnedMoneyPerProfession).reduce((a, b) => a[1] > b[1] ? a : b);

    res.json(`The best profession was ${bestProfessionWithMoney[0]}, which earned a total of ${bestProfessionWithMoney[1]}.`);
};

const getBestClients = async (req, res) => {
    const { sequelize } = require('../model');
    const { Op } = require("sequelize");
    const { Contract, Profile, Job } = req.app.get('models');
    const { start, end, limit } = req.query;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const countLimit = parseInt(limit ? limit : 2);

    if (startDate == 'Invalid Date' || endDate == 'Invalid Date') return res.status(500).end('Start and end must be valid dates specified in YYYY-MM-DD format');
    if (isNaN(countLimit)) return res.status(500).end('Limit must be a number');

    const paidJobsForPeriod = await Job.findAll({
        attributes: [[sequelize.fn('sum', sequelize.col('price')), 'totalPaid'],],
        order: [[sequelize.fn('sum', sequelize.col('price')), 'DESC']],
        where: {
            paid: true,
            paymentDate: {
                [Op.between]: [startDate, endDate]
            }
        },
        include: [
            {
                model: Contract,
                include: [
                    {
                        model: Profile,
                        as: 'Client',
                        where: { type: 'client' },
                        attributes: ['firstName', 'lastName']
                    }
                ],
                attributes: ['ClientId']
            }
        ],
        group: 'Contract.ClientId',
        limit: countLimit
    });

    const paidPerClient = paidJobsForPeriod.map(function (x) {
        return {
            id: x.Contract.ClientId,
            fullName: x.Contract.Client.firstName + ' ' + x.Contract.Client.lastName,
            paid: x.dataValues.totalPaid
        };
    });

    res.json(paidPerClient);
};

module.exports = { getBestClients, getBestProfession };