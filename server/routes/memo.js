import express from 'express';
import Memo from '../models/memo';
import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const router = express.Router();

(function () {
    "use strict";
})();

router.post('/', (req, res) => {
    if (typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: "NOT LOGGED IN",
            code: 1
        });
    }

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

    let memo = new Memo({
        writer: req.session.loginInfo.username,
        contents: req.body.contents
    });

    memo.save(err => {
        if (err) throw err;
        return res.json({success: true});
    });
});

router.put('/:id', (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            error: "INVALID ID",
            code: 1
        });
    }

    if (typeof req.body.contents !== 'string' || req.body.contents === "") {
        return res.status(400).json({
            error: "EMPTY CONTENTS",
            code: 2
        });
    }

    if (typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: "NOT LOGGED IN",
            code: 3
        });
    }

    Memo.findById(req.params.id, (err, memo) => {
        if (err) throw err;

        if (!memo) {
            return res.status(404).json({
                error: "NO RESOURCE",
                code: 4
            });
        }

        if (memo.writer != req.session.loginInfo.username) {
            return res.status(403).json({
                error: "PERMISSION FAILURE",
                code: 5
            });
        }

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

        if (memo.writer != req.session.loginInfo.username) {
            return res.status(403).json({
                error: "PERMISSION FAILURE",
                code: 4
            });
        }

        Memo.remove({_id: req.params.id}, err => {
            if (err) throw err;
            res.json({success: true});
        });
    });
});

router.get('/:listType/:id', (req, res) => {

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
        Memo.find({_id: {$gt: objId}})
            .sort({_id: -1})
            .limit(6)
            .exec((err, memos) => {
                if (err) throw err;
                return res.json(memos);
            });
    } else {
        Memo.find({_id: {$lt: objId}})
            .sort({_id: -1})
            .limit(6)
            .exec((err, memos) => {
                if (err) throw err;
                return res.json(memos);
            });
    }
});

export default router;