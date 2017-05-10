import express from 'express';
import Memo from '../models/memo';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/', (req, res) => {
    // CHECK LOGIN STATUS
    if (typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: "NOT LOGGED IN",
            code: 1
        });
    }

    // CHECK CONTENTS VALID
    if (typeof req.body.contents !== 'string') {
        return res.status(400).json({
            error: "EMPTY CONTENTS",
            code: 2
        });
    }

    if (req.body.contents === "") {
        return res.status(400).json({
            error: "EMPTY CONTENTS",
            code: 2
        });
    }

    // CREATE NEW MEMO
    let memo = new Memo({
        writer: req.session.loginInfo.username,
        contents: req.body.contents
    });

    // SAVE IN DATABASE
    memo.save(err => {
        if (err) throw err;
        return res.json({success: true});
    });
});

router.put('/:id', (req, res) => {

    // CHECK MEMO ID VALIDITY
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            error: "INVALID ID",
            code: 1
        });
    }

    // CHECK CONTENTS VALID
    if (typeof req.body.contents !== 'string') {
        return res.status(400).json({
            error: "EMPTY CONTENTS",
            code: 2
        });
    }

    if (req.body.contents === "") {
        return res.status(400).json({
            error: "EMPTY CONTENTS",
            code: 2
        });
    }

    // CHECK LOGIN STATUS
    if (typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: "NOT LOGGED IN",
            code: 3
        });
    }

    // FIND MEMO
    Memo.findById(req.params.id, (err, memo) => {
        if (err) throw err;

        // IF MEMO DOES NOT EXIST
        if (!memo) {
            return res.status(404).json({
                error: "NO RESOURCE",
                code: 4
            });
        }

        // IF EXISTS, CHECK WRITER
        if (memo.writer != req.session.loginInfo.username) {
            return res.status(403).json({
                error: "PERMISSION FAILURE",
                code: 5
            });
        }

        // MODIFY AND SAVE IN DATABASE
        memo.contents = req.body.contents;
        memo.date.edited = new Date();
        memo.is_edited = true;

        memo.save((err, memo) => {
            if (err) throw err;
            return res.json({
                success: true,
                memo
            });
        });

    });
});

router.delete('/:id', (req, res) => {

    // CHECK MEMO ID VALIDITY
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            error: "INVALID ID",
            code: 1
        });
    }

    // CHECK LOGIN STATUS
    if (typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: "NOT LOGGED IN",
            code: 2
        });
    }

    // FIND MEMO AND CHECK FOR WRITER
    Memo.findById(req.params.id, (err, memo) => {
        if (err) throw err;

        if (!memo) {
            return res.status(404).json({
                error: "NO RESOURCE",
                code: 3
            });
        }
        if (memo.writer != req.session.loginInfo.username) {
            return res.status(403).json({
                error: "PERMISSION FAILURE",
                code: 4
            });
        }

        // REMOVE THE MEMO
        Memo.remove({_id: req.params.id}, err => {
            if (err) throw err;
            res.json({success: true});
        });
    });

});

/*
 READ MEMO: GET /api/memo
 */
router.get('/', (req, res) => {
    Memo.find()
        .sort({"_id": -1})
        .limit(6)
        .exec((err, memos) => {
            if (err) throw err;
            res.json(memos);
        });
});

/*
 READ ADDITIONAL (OLD/NEW) MEMO: GET /api/memo/:listType/:id
 */
router.get('/:username/:listType/:id', (req, res) => {
    let listType = req.params.listType;
    let id = req.params.id;

    // CHECK LIST TYPE VALIDITY
    if (listType !== 'old' && listType !== 'new') {
        return res.status(400).json({
            error: "INVALID LISTTYPE",
            code: 1
        });
    }

    // CHECK MEMO ID VALIDITY
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: "INVALID ID",
            code: 2
        });
    }

    let objId = new mongoose.Types.ObjectId(req.params.id);

    if (listType === 'new') {
        // GET NEWER MEMO
        Memo.find({ writer:req.params.username, _id: {$gt: objId}})
            .sort({_id: -1})
            .limit(6)
            .exec((err, memos) => {
                if (err) throw err;
                return res.json(memos);
            });
    } else {
        // GET OLDER MEMO
        Memo.find({writer: req.params.username, _id: {$lt: objId}})
            .sort({_id: -1})
            .limit(6)
            .exec((err, memos) => {
                if (err) throw err;
                return res.json(memos);
            });
    }
});

router.post('/star/:id', (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            error: "INVALID ID",
            code: 1
        });
    }

    if (typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: "NOT LOGGED IN",
            code: 2
        });
    }

    Memo.findById(req.params.id, (err, memo) => {
        if (err) throw err;

        if (!memo) {
            return res.status(404).json({
                error: "NO RESOURCE",
                code: 3
            });
        }

        let index = memo.starred.indexOf(req.session.loginInfo.username);

        let hasStarred = (index === -1) ? false : true;

        if (!hasStarred) {
            memo.starred.push(req.session.loginInfo.username);
        } else {
            memo.starred.splice(index, 1);
        }

        memo.save((err, memo) => {
            if (err) throw err;
            res.json({
                success: true,
                'has_starred': !hasStarred,
                memo
            });
        });
    });
});

router.get('/:username', (req, res) => {
    Memo.find({writer: req.params.username})
        .sort({"_id": -1})
        .limit(6)
        .exec((err, memos) => {
            if (err) throw err;
            res.json(memos);
        });
});

router.get('/:username/:listType/:id', (req, res) => {
    let listType = req.params.listType;
    let id = req.params.id;

    if (listType !== 'old' && listType !== 'new') {
        return res.status(400).json({
            error: "INVALID LISTTYPE",
            code: 1
        });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: "INVALID ID",
            code: 2
        });
    }

    let objId = new mongoose.Types.ObjectId(req.params.id);

    if (listType === 'new') {
        Memo.find({writer: req.params.username, _id: {$gt: objId}})
            .sort({_id: -1})
            .limit(6)
            .exec((err, memos) => {
                if (err) throw err;
                return res.json(memos);
            });
    } else {
        Memo.find({writer: req.params.username, _id: {$lt: objId}})
            .sort({_id: -1})
            .limit(6)
            .exec((err, memos) => {
                if (err) throw err;
                return res.json(memos);
            });
    }
});
export default router;