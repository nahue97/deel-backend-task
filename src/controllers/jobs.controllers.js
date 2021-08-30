const getAllUnpaid = async (req, res) => {
    const { Contract, Job } = req.app.get('models');
    const { id, type } = req.profile;

    const contractWhere = { status: 'in_progress' };
    if (type == 'client') {
        contractWhere.ClientId = id;
    } else {
        contractWhere.ContractorId = id;
    }

    const jobs = await Job.findAll({
        where: {
            paid: null
        },
        include: [
            {
                model: Contract,
                where: contractWhere
            }
        ]
    });

    res.json(jobs);
};

const pay = async (req, res) => {
    const { sequelize } = require('../model');
    const { Contract, Job, Profile } = req.app.get('models');
    const { job_id } = req.params;
    const { id, balance } = req.profile;

    const job = await Job.findOne({
        where: {
            id: job_id,
            paid: null
        },
        include: [
            {
                model: Contract,
                where: { ClientId: id }
            }
        ]
    });

    if (!job) return res.status(404).end('Unpaid job not found for user');
    if (balance < job.price) return res.status(400).end('Insufficient funds');
  
    const client = req.profile;
    const contractor = await Profile.findOne({
        where: {
            id: job.Contract.ContractorId,
            type: "contractor"
        }
    });

    const transaction = await sequelize.transaction();

    try {
        await client.decrement({ balance: job.price }, { transaction });
        await contractor.increment({ balance: job.price }, { transaction });
        await job.update({ paid: true, paymentDate: Date.now() }, { transaction });

        await transaction.commit();
        res.json(job);
    } catch (error) {
        await transaction.rollback();
        return res.status(500).end('There was an error while paying for the job');
    }
};

module.exports = { getAllUnpaid, pay };