define([
    "dojo/_base/declare",
    "mijit/_WidgetBase",
    "dojo/request/xhr",
    "ol"

], function (declare, WidgetBase, xhr, ol) {
    return declare([WidgetBase], {

        url: null,

        postCreate: function () {
            this.inherited(arguments);
        },

        startup: function () {
            this.inherited(arguments);
        },

        searchPerceel: function (coordinate) {
            var url = this.url;
            var data = '' +
                '<wfs:GetFeature xmlns:topp="http://www.openplans.org/topp" ' +
                'xmlns:wfs="http://www.opengis.net/wfs" ' +
                'xmlns:ogc="http://www.opengis.net/ogc" ' +
                'xmlns:gml="http://www.opengis.net/gml" ' +
                'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                'service="WFS" ' +
                'version="1.1.0"  ' +
                'maxFeatures="10" ' +
                'xsi:schemaLocation="http://www.opengis.net/wfs ' +
                'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">' +
                '<wfs:Query typeName="grb:GRB_-_Adp_-_administratief_perceel">' +
                '<ogc:Filter>' +
                '<ogc:Contains>' +
                '<ogc:PropertyName>SHAPE</ogc:PropertyName>' +
                '<gml:Point srsName="urn:x-ogc:def:crs:EPSG:3857">' +
                '<gml:pos srsName="urn:x-ogc:def:crs:EPSG:3857">' + coordinate[0] + ' ' + coordinate[1] + '</gml:pos>' +
                '</gml:Point>' +
                '</ogc:Contains>' +
                '</ogc:Filter>' +
                '  </wfs:Query>' +
                '</wfs:GetFeature>';

            //var mock_response = "<wfs:FeatureCollection xsi:schemaLocation='https://geo.agiv.be/ogc/wfs/grb http://geo.agiv.be/Arcgis/services/grbwfs/MapServer/WFSServer?request=Descr…eFeatureType%26version=1.1.0%26typename=GRB_-_Adp_-_administratief_perceel http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd' xmlns:grb='https://geo.agiv.be/ogc/wfs/grb' xmlns:gml='http://www.opengis.net/gml' xmlns:wfs='http://www.opengis.net/wfs' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'><gml:boundedBy><gml:Envelope srsName='urn:ogc:def:crs:EPSG:6.9:31370'><gml:lowerCorner>22282.325400002301 153053.63879999891</gml:lowerCorner><gml:upperCorner>258866.46169999987 244026.45450000092</gml:upperCorner></gml:Envelope></gml:boundedBy><gml:featureMember><grb:GRB_-_Adp_-_administratief_perceel gml:id='F-1__344666'><grb:UIDN>364232</grb:UIDN><grb:OIDN>344666</grb:OIDN><grb:CAPAKEY>42016B0160/00B000</grb:CAPAKEY><grb:NISCODE>42006</grb:NISCODE><grb:TOESTDATUM>2013-01-01T00:00:00</grb:TOESTDATUM><grb:LENGTE>360.67000000000002</grb:LENGTE><grb:OPPERVL>3147.5100000000002</grb:OPPERVL><grb:SHAPE><gml:MultiSurface><gml:surfaceMember><gml:Polygon><gml:exterior><gml:LinearRing><gml:posList> 127952.15869999677 189344.60020000115 127949.53769999743 189349.15799999982 127802.93169999868 189288.80090000108 127805.05900000036 189282.25189999864 127808.7248999998 189270.96330000088 127959.84579999745 189331.23189999908 127952.15869999677 189344.60020000115</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon></gml:surfaceMember></gml:MultiSurface></grb:SHAPE></grb:GRB_-_Adp_-_administratief_perceel></gml:featureMember></wfs:FeatureCollection> ";

            return xhr.post(url, {
                data: data,
                headers: {
                    "X-Requested-With": "",
                    "Content-Type": "application/xml"
                }
            });
        },

        readWfs: function (wfs) {
            var formatter = new ol.format.WFS({
                featureNS: "https://geo.agiv.be/ogc/wfs/grb",
                featureType: "GRB_-_Adp_-_administratief_perceel"
            });
            var features = formatter.readFeatures(wfs);
            return features[0];
        }
    });
});