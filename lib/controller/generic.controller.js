const router = require('express').Router();
const pluralize = require('pluralize');

//TODO: Migrate to standalone package
//TODO: Better error handling
class GenericController {

    constructor(model, endpoint) {
        this._model = model;
        this._endpoint = endpoint || pluralize(model.modelName.toLowerCase());

        this._beforeList = [];
        this._beforeCreate = [];
        this._beforeFind = [];
        this._beforeUpdate = [];
        this._beforeRemove = [];

        this._afterList = [];
        this._afterCreate = [];
        this._afterFind = [];
        this._afterUpdate = [];
        this._afterRemove = [];
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

    create(req, res, next) {
        var newObject = new this._model(req.body);

        newObject.save((err) => {
            if (err) {
                return next(err);
            }

            res.json(newObject);
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

    update(req, res, next) {
        this._model.findOneAndUpdate({ '_id': req.params.id }, req.body, { new: true }, (err, object) => {
            if (err) {
                return next(err);
            }

            res.json(object);
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

    //Routing methods

    beforeListRoute(middleware) {
        this._beforeList.push(middleware);
    }

    afterListRoute(middleware) {
        this._afterList.push(middleware);
    }

    chainListRoute() {
        return [
            ...this._beforeList,
            this.list.bind(this),
            ...this._afterList
        ];
    }

    beforeCreateRoute(middleware) {
        this._beforeCreate.push(middleware);
    }

    afterCreateRoute(middleware) {
        this._afterCreate.push(middleware);
    }

    chainCreateRoute() {
        return [
            ...this._beforeCreate,
            this.create.bind(this),
            ...this._afterCreate
        ];
    }

    beforeFindRoute(middleware) {
        this._beforeFind.push(middleware);
    }

    afterFindRoute(middleware) {
        this._afterFind.push(middleware);
    }

    chainFindRoute() {
        return [
            ...this._beforeFind,
            this.find.bind(this),
            ...this._afterFind
        ];
    }

    beforeUpdateRoute(middleware) {
        this._beforeUpdate.push(middleware);
    }

    afterUpdateRoute(middleware) {
        this._afterUpdate.push(middleware);
    }

    chainUpdateRoute() {
        return [
            ...this._beforeUpdate,
            this.update.bind(this),
            ...this._afterUpdate
        ];
    }

    beforeRemoveRoute(middleware) {
        this._beforeRemove.push(middleware);
    }

    afterRemoveRoute(middleware) {
        this._afterRemove.push(middleware);
    }

    chainRemoveRoute() {
        return [
            ...this._beforeRemove,
            this.remove.bind(this),
            ...this._afterRemove
        ];
    }

    //TODO: Come up with a way to handle the routing in a better way.
    //TODO: Allow to chain middleware before and after the method.
    route() {
        router.get('/' + this._endpoint + '/', this.chainListRoute());
        router.post('/' + this._endpoint + '/', this.chainCreateRoute());
        router.get('/' + this._endpoint + '/:id', this.chainFindRoute());
        router.put('/' + this._endpoint + '/:id', this.chainUpdateRoute());
        router.delete('/' + this._endpoint + '/:id', this.chainRemoveRoute());

        return router;
    }
}

module.exports = GenericController;
