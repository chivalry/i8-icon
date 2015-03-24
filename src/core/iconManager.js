'use strict';

service('iconManager', function(service) {

  var
    CHECK_URL_REGEX = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i,
    DEFAULT_ICON_SIZE = 24,
    SINGLE_ICONS_COLLECTION_ID = '__SINGLE_ICONS_COLLECTION';

  function IconManager() {
    this._collections = {};
    this._defaultCollectionId = null;
    this._defaultIconSize = DEFAULT_ICON_SIZE;
  }

  IconManager.prototype = {

    addIcon: function(id, urlResolver, options) {
      var
        SvgIconScope = service('SvgIconScope');
      this._getSingleIconsCollection().add(new SvgIconScope(id, urlResolver, options));
      return this;
    },

    addSvgIconSet: function(id, urlResolver, options) {
      var
        SvgCumulativeIconSetScope = service('SvgCumulativeIconSetScope'),
        SvgIconSetScope = service('SvgIconSetScope'),
        scope;

      options = options || {};

      scope = options.cumulative
        ? new SvgCumulativeIconSetScope(id, urlResolver, options)
        : new SvgIconSetScope(id, urlResolver, options);

      this._getCollection(id).add(scope);

      return this;
    },

    addFontIconSet: function(id, classResolver) {
      var
        FontIconSetScope = service('FontIconSetScope');
      this._getCollection(id).add(new FontIconSetScope(id, classResolver));
      return this;
    },

    addIconSetAlias: function(id, alias) {
      if (!this._collections.hasOwnProperty(alias)) {
        this._collections[alias] = this._getCollection(id);
      }
      return this;
    },

    setDefaultIconSet: function(id) {
      this._defaultCollectionId = id;
      return this;
    },

    setDefaultIconSize: function(iconSize) {
      this._defaultIconSize = iconSize;
      return this;
    },

    getDefaultIconSize: function() {
      return this._defaultIconSize;
    },

    preLoad: function() {
      var
        collections = this._collections;

      Object.keys(collections).forEach(function(id) {
        collections[id].preLoad();
      });

    },

    getIcon: function(id) {
      var
        delimiterPosition,
        iconId,
        iconSetId;

      id = id || '';

      if (CHECK_URL_REGEX.test(id)) {
        if (!this.hasSingleIcon(id)) {
          this.addIcon(id, id);
        }
        return this._getSingleIcon(id)
          .then(null, announceIconNotFoundForPromiseCatch(id));
      }

      iconId = id;
      iconSetId = null;
      delimiterPosition = id.indexOf(':');
      if (delimiterPosition != -1) {
        iconSetId = id.slice(0, delimiterPosition);
        iconId = id.slice(delimiterPosition+1);
      }

      if (iconSetId) {
        if (this.hasIconSet(iconSetId)) {
          return this._getIconFromIconSet(iconId, iconSetId)
            .then(null, announceIconNotFoundForPromiseCatch(iconId, iconSetId));
        }
      }
      else {
        if (this.hasSingleIcon(iconId)) {
          return this._getSingleIcon(iconId)
            .then(null, announceIconNotFoundForPromiseCatch(iconId));
        }
        if (this.hasDefaultIconSet()) {
          return this._getIconFromDefaultIconSet(iconId)
            .then(null, announceIconNotFoundForPromiseCatch(iconId, this._defaultCollectionId));
        }
      }

      return announceIconNotFound(id);
    },

    hasSingleIcon: function(id) {
      return this._getSingleIconsCollection()
        .collection
        .filter(function(scope) {
          return scope.hasIcon(id);
        })
        .length > 0;
    },

    hasIconSet: function(id) {
      return this._collections.hasOwnProperty(id);
    },

    hasDefaultIconSet: function() {
      return this._defaultCollectionId && this.hasIconSet(this._defaultCollectionId);
    },

    _getCollection: function(id) {
      var
        ScopeCollection = service('ScopeCollection');
      if (!this._collections.hasOwnProperty(id)) {
        this._collections[id] = new ScopeCollection();
      }
      return this._collections[id];
    },

    _getSingleIconsCollection: function() {
      return this._getCollection(SINGLE_ICONS_COLLECTION_ID);
    },

    _getSingleIcon: function(id) {
      return this._getSingleIconsCollection().getIcon(id);
    },

    _getIconFromDefaultIconSet: function(id) {
      return this._getIconFromIconSet(id, this._defaultCollectionId);
    },

    _getIconFromIconSet: function(iconId, iconSetId) {
      return this._getCollection(iconSetId).getIcon(iconId);
    }

  };


  function announceIconNotFound(iconId, iconSetId) {
    var
      log = service('log'),
      Promise = service('Promise'),
      errorMessage = 'icon "' + iconId + '" not found';

    if (iconSetId) {
      errorMessage += ' in "' + iconSetId + '" icon set';
    }
    log.warn(errorMessage);
    return Promise.reject(errorMessage);
  }

  function announceIconNotFoundForPromiseCatch(iconId, iconSetId) {
    return function() {
      return announceIconNotFound(iconId, iconSetId);
    }
  }



  return new IconManager;


});
