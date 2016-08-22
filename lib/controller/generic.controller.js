const router = require('express').Router();
const pluralize = require('pluralize');

//TODO: Migrate to standalone package
//TODO: Better error handling
class GenericController {

    constructor(model, endpoint, beforePost, beforeGet) {
        this._model = model;
        this._endpoint = endpoint || pluralize(model.modelName.toLowerCase());
        this._beforePost = beforePost || [];
        this._beforeGet = beforeGet || [];
    }

    //TODO: Use smaller query variables names.
    //Consider creating a search class to map entity values with smaller names.
    //Such class should implement methods to throw itself to a entity and back.
    list(req, res, next) {
        var limit = req.query.limit || 50;
        var fields = req.query.fields || null;
        var skip = req.query.skip || 0;
        var sort = req.query.sort || '-createdAt';

        this._model.find(req.query.criteria)
            .select(fields)
            .limit(limit)
            .skip(skip)
            .sort(sort)
            .exec((err, object) => {
                if (err) {
                    return next(err);
                }

                res.json(object);
            });
    }

    find(req, res, next) {
        this._model.findOne({ '_id': req.params.id }, function(err, object) {
            if (err) {
                return next(err);
            }

            res.json(object);
        });
    }

    create(req, res, next) {
        var newObject = new this._model(req.body);

        newObject.save((err) => {
            if (err) {
                return next(err);
            }

            res.json(newObject);
        });
    }

    remove(req, res, next) {
        this._model.findOneAndRemove({ '_id': req.params.id }, (err, object) => {
            if (err) {
                return next(err);
            }

            res.json(object);
        });
    }

    update(req, res, next) {
        this._model.findOneAndUpdate({ '_id': req.params.id }, req.body, {new: true}, (err, object) => {
            if (err) {
                return next(err);
            }

            res.json(object);
        });
    }

    createRoute() {
        var beforeCreate = [];
        var afterCreate = [];

        beforeCreate.push((req, res, next) => { console.log('Trying to create entity:', req.body); next(); });
        return [
            ...beforeCreate,
            this.create.bind(this),
            ...afterCreate
        ];
    }

    //TODO: Come up with a way to handle the routing in a better way.
    //TODO: Allow to chain middleware before and after the method.
    route() {
        router.get('/' + this._endpoint + '/', this._beforeGet, this.list.bind(this));
        router.post('/' + this._endpoint + '/', this.createRoute());
        //router.post('/' + this._endpoint + '/', this._beforePost, this.create.bind(this));
        router.get('/' + this._endpoint + '/:id', this.find.bind(this));
        router.put('/' + this._endpoint + '/:id', this.update.bind(this));
        router.delete('/' + this._endpoint + '/:id', this.remove.bind(this));

        return router;
    }
}

module.exports = GenericController;