Ext.define('EdiromOnline.view.window.text.FacsimileView', {
    extend: 'Ext.panel.Panel',

    mixins: {
        observable: 'Ext.util.Observable'
    },

    requires: [
        'EdiromOnline.view.window.image.ImageViewer'
    ],

    alias : 'widget.facsimileView',

    layout: 'border',

    border: 0,

    imageSet: null,
    imageToShow: null,

    measuresVisible: false,
    annotationsVisible: false,

    initComponent: function () {

        this.addEvents();

        this.imageViewer = Ext.create('EdiromOnline.view.window.image.ImageViewer');
        this.imageViewer.region = 'center';

        this.bottomBar = new EdiromOnline.view.window.BottomBar({owner:this, region:'south'});

        this.items = [
            this.imageViewer,
            this.bottomBar
        ];

        this.callParent();

        this.on('afterrender', this.createMenuEntries, this, {single: true});
        this.on('afterrender', this.createToolbarEntries, this, {single: true});
        this.on('afterrender', this.onAfterRender, this, {single: true});
        this.imageViewer.on('zoomChanged', this.updateZoom, this);

        this.window.on('loadInternalLink', this.loadInternalId, this);
    },

    loadInternalId: function() {
        var me = this;

        if(me.window.internalIdType == 'surface' || me.window.internalIdType == 'graphic' ) {
            me.window.requestForActiveView(me);
            me.showPage(me.window.internalId);
        }
    },

    setImageSet: function(imageSet) {
        var me = this;
        me.imageSet = imageSet;

        me.pageSpinner.setStore(me.imageSet);

        if(me.imageToShow != null) {
            me.pageSpinner.setPage(me.imageSet.getById(me.imageToShow));
            me.imageToShow = null;

        }else if(me.imageSet.getCount() > 0)
            me.pageSpinner.setPage(me.imageSet.getAt(0));
            
        me.fireEvent('afterImagesLoaded', me, imageSet);
    },

    setPage: function(combo, store) {

        var me = this;

        // Remove old stuff
        me.imageViewer.clear();

        var id = combo.getValue();
        var imgIndex = me.imageSet.findExact('id', id);
        me.activePage = me.imageSet.getAt(imgIndex);

        me.imageViewer.showImage(me.activePage.get('path'),
            me.activePage.get('width'), me.activePage.get('height'));
    },

    showPage: function(pageId) {
        var me = this;

        if(me.imageSet == null) {
            me.imageToShow = pageId;
            return;
        }

        me.pageSpinner.setPage(me.imageSet.getById(pageId));
    },

    getActivePage: function() {
        return this.activePage;
    },

    createMenuEntries: function() {

        var me = this;

        me.viewMenu =  Ext.create('Ext.button.Button', {
            text: getLangString('view.window.source.SourceView_viewMenu'),
            indent: false,
            cls: 'menuButton',
            menu : {
                items: [
                    {
                        id: me.id + '_fitFacsimile',
                        text: getLangString('view.window.source.SourceView_fitView'),
                        handler: Ext.bind(me.fitFacsimile, me, [], 0)
                    }
                ]
            }
        });
        me.window.getTopbar().addViewSpecificItem(me.viewMenu, me.id);
    },

    createToolbarEntries: function() {

        var me = this;

        me.zoomSlider = Ext.create('Ext.slider.Single', {
            width: 140,
            value: 100,
            increment: 5,
            minValue: 10,
            maxValue: 400,
            checkChangeBuffer: 100,
            useTips: true,
            cls: 'zoomSlider',
            tipText: function(thumb){
                return Ext.String.format('{0}%', thumb.value);
            },
            listeners: {
                change: Ext.bind(me.zoomChanged, me, [], 0)
            }
        });
        me.bottomBar.add(me.zoomSlider);

        me.pageSpinner = Ext.create('EdiromOnline.view.window.util.PageSpinner', {
            width: 111,
            cls: 'pageSpinner',
            owner: me
        });
        me.bottomBar.add(me.pageSpinner);
    },

    fitFacsimile: function() {
        this.imageViewer.fitInImage();
    },

    updateZoom: function(zoom) {
        this.zoomSlider.suspendEvents();
        this.zoomSlider.setValue(Math.round(zoom * 100));
        this.zoomSlider.resumeEvents();
    },

    zoomChanged: function(slider) {
        this.imageViewer.setZoomAndCenter(slider.getValue() / 100);
    },
    
    onAfterRender: function() {
        var me = this;

        if(me.initialized) return;
        me.initialized = true;

        Ext.Ajax.request({
            url: 'data/xql/getPages.xql',
            method: 'GET',
            params: {
                uri: me.uri
            },
            success: function(response){
                var data = response.responseText;

                var pages = Ext.create('Ext.data.Store', {
                    fields: ['id', 'name', 'path', 'width', 'height', 'measures', 'annotations'],
                    data: Ext.JSON.decode(data)
                });

                me.setImageSet(pages);
            }
        });
    }
});