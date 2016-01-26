
                    var styleCache_Zoneswaargeenarcheologieteverwachtenvalt={}
                    var style_Zoneswaargeenarcheologieteverwachtenvalt = function(feature, resolution){
                        var value = ""
                        var style = [ new ol.style.Style({
                            stroke: new ol.style.Stroke({color: "rgba(0,0,0,0.51)", lineDash: null, width: 0}), 
                        fill: new ol.style.Fill({color: "rgba(255,64,0,0.35)"})
                        })
                        ];
                        var labelText = "";
                        var key = value + "_" + labelText

                        if (!styleCache_Zoneswaargeenarcheologieteverwachtenvalt[key]){
                            var text = new ol.style.Text({
                                  font: '11.0px Calibri,sans-serif',
                                  text: labelText,
                                  fill: new ol.style.Fill({
                                    color: "rgba(0, 0, 0, 255)"
                                  }),
                                });
                            styleCache_Zoneswaargeenarcheologieteverwachtenvalt[key] = new ol.style.Style({"text": text});
                        }
                        var allStyles = [styleCache_Zoneswaargeenarcheologieteverwachtenvalt[key]];
                        allStyles.push.apply(allStyles, style);
                        return allStyles;
                    };
