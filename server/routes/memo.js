import express from 'express';
import Memo from '../models/memo';
import mongoose from 'mongoose';

const router = express.Router();


//Write
router.post('/', (req, res) => {

    if (typeof req.session.loginInfo === 'undefined') {
        return res.status(403).json({
            error: "NOT LOGGED IN",
            code: 1
        });
    }

    //check contents
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

    //save in db
    memo.save(err => {
        if (err) throw err;
        return res.json({success: true});
    });
});

//Modify
router.put('/:id', (req, res) => {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            error: "INVALID ID",
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

    //check logininfo
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

//Delete
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

//Read memo
router.get('/', (req, res) => {
    Memo.find()
        .sort({"_id": -1})
        .limit(7)
        .exec((err, memos) => {
            if (err) throw err;
            res.json(memos);
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

        Memo.find({_id : {$gt : objId}})
            .sort({_id :-1})
            .limit(7)
            .exec((err, memos) =>{
            if(err) throw err;
            return res.json(memos);
        });

    } else {

        Memo.find({_id: {$lt: objId}})
            .sort({_id: -1})
            .limit(7)
            .exec((err, memos) => {
                if (err) throw err;
                return res.json(memos);
            });
    }
});

//STAR memo
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


//Search Memo of a user
router.get('/:username', (req, res) => {
    Memo.find({writer: req.params.username})
        .sort({"_id": -1})
        .limit(7)
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
            .limit(7)
            .exec((err, memos) => {
                if (err) throw err;
                return res.json(memos);
            });
    } else {
        Memo.find({writer: req.params.username, _id: {$lt: objId}})
            .sort({_id: -1})
            .limit(7)
            .exec((err, memos) => {
                if (err) throw err;
                return res.json(memos);
            });
    }
});
export default router;