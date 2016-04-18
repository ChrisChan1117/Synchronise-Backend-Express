var InputType;

dependenciesLoader(["React", "ReactDOM", "_"], function(){
    // ----------------------------------- INPUTS -----------------------------------------------------
    // Displays one select option with the given values
    var InputTypeContent = React.createClass({
        onClickArrow: function(){
            $(ReactDOM.findDOMNode(this)).find('select').trigger('click');
        },
        render: function(){
            return (
                <div style={{paddingRight: "7px", display: "inline-block"}}>
                    <select className="form-control input-xs type"
                            value={this.props.value}
                            onChange={this.props.changed.bind(null, this.props.index)}>
                        {this.props.options.map(function(row){
                            return <option value={row.name}
                                           key={row.name}>{row.label}</option>
                        })}
                    </select>
                    <div htmlFor="type"
                        onClick={this.onClickArrow}
                        style={{
                        display: "inline-block",
                        height: "17px",
                        width: "10px",
                        lineHeight: "16px",
                        marginRight: "-10px",
                        backgroundColor: "darkgray",
                        color: "white"}}><i className="fa fa-angle-down" style={{marginLeft: "-4px", height: "100%"}}></i></div>
                </div>
            );
        }
    });

    // Displays all of the select options of the list
    // - (boolean)displayOptionalButton: Whether or not to display a button that allows to make the input as optional
    InputType = React.createClass({
        getInitialState: function(){
            return {
                selectedType: ["text"],
                types: {
                    text: {
                        name: "text",
                        label: "Text",
                        subtypes: {
                            text: {
                                name: "text",
                                label: "Text"
                            },
                            email: {
                                name: "email",
                                label: "Email"
                            },
                            /*phone: {
                                name: "phone",
                                label: "Telephone",
                                subtypes: {"AF":{"name":"AF","label":"(+93)Afghanistan"},"AX":{"name":"AX","label":"(+358)Aland Islands"},"AL":{"name":"AL","label":"(+355)Albania"},"DZ":{"name":"DZ","label":"(+213)Algeria"},"AS":{"name":"AS","label":"(+1 684)AmericanSamoa"},"AD":{"name":"AD","label":"(+376)Andorra"},"AO":{"name":"AO","label":"(+244)Angola"},"AI":{"name":"AI","label":"(+1 264)Anguilla"},"AQ":{"name":"AQ","label":"(+672)Antarctica"},"AG":{"name":"AG","label":"(+1268)Antigua and Barbuda"},"AR":{"name":"AR","label":"(+54)Argentina"},"AM":{"name":"AM","label":"(+374)Armenia"},"AW":{"name":"AW","label":"(+297)Aruba"},"AU":{"name":"AU","label":"(+61)Australia"},"AT":{"name":"AT","label":"(+43)Austria"},"AZ":{"name":"AZ","label":"(+994)Azerbaijan"},"BS":{"name":"BS","label":"(+1 242)Bahamas"},"BH":{"name":"BH","label":"(+973)Bahrain"},"BD":{"name":"BD","label":"(+880)Bangladesh"},"BB":{"name":"BB","label":"(+1 246)Barbados"},"BY":{"name":"BY","label":"(+375)Belarus"},"BE":{"name":"BE","label":"(+32)Belgium"},"BZ":{"name":"BZ","label":"(+501)Belize"},"BJ":{"name":"BJ","label":"(+229)Benin"},"BM":{"name":"BM","label":"(+1 441)Bermuda"},"BT":{"name":"BT","label":"(+975)Bhutan"},"BO":{"name":"BO","label":"(+591)Bolivia, Plurinational State of"},"BA":{"name":"BA","label":"(+387)Bosnia and Herzegovina"},"BW":{"name":"BW","label":"(+267)Botswana"},"BR":{"name":"BR","label":"(+55)Brazil"},"IO":{"name":"IO","label":"(+246)British Indian Ocean Territory"},"BN":{"name":"BN","label":"(+673)Brunei Darussalam"},"BG":{"name":"BG","label":"(+359)Bulgaria"},"BF":{"name":"BF","label":"(+226)Burkina Faso"},"BI":{"name":"BI","label":"(+257)Burundi"},"KH":{"name":"KH","label":"(+855)Cambodia"},"CM":{"name":"CM","label":"(+237)Cameroon"},"CA":{"name":"CA","label":"(+1)Canada"},"CV":{"name":"CV","label":"(+238)Cape Verde"},"KY":{"name":"KY","label":"(+ 345)Cayman Islands"},"CF":{"name":"CF","label":"(+236)Central African Republic"},"TD":{"name":"TD","label":"(+235)Chad"},"CL":{"name":"CL","label":"(+56)Chile"},"CN":{"name":"CN","label":"(+86)China"},"CX":{"name":"CX","label":"(+61)Christmas Island"},"CC":{"name":"CC","label":"(+61)Cocos (Keeling) Islands"},"CO":{"name":"CO","label":"(+57)Colombia"},"KM":{"name":"KM","label":"(+269)Comoros"},"CG":{"name":"CG","label":"(+242)Congo"},"CD":{"name":"CD","label":"(+243)Congo, The Democratic Republic of the Congo"},"CK":{"name":"CK","label":"(+682)Cook Islands"},"CR":{"name":"CR","label":"(+506)Costa Rica"},"CI":{"name":"CI","label":"(+225)Cote d'Ivoire"},"HR":{"name":"HR","label":"(+385)Croatia"},"CU":{"name":"CU","label":"(+53)Cuba"},"CY":{"name":"CY","label":"(+357)Cyprus"},"CZ":{"name":"CZ","label":"(+420)Czech Republic"},"DK":{"name":"DK","label":"(+45)Denmark"},"DJ":{"name":"DJ","label":"(+253)Djibouti"},"DM":{"name":"DM","label":"(+1 767)Dominica"},"DO":{"name":"DO","label":"(+1 849)Dominican Republic"},"EC":{"name":"EC","label":"(+593)Ecuador"},"EG":{"name":"EG","label":"(+20)Egypt"},"SV":{"name":"SV","label":"(+503)El Salvador"},"GQ":{"name":"GQ","label":"(+240)Equatorial Guinea"},"ER":{"name":"ER","label":"(+291)Eritrea"},"EE":{"name":"EE","label":"(+372)Estonia"},"ET":{"name":"ET","label":"(+251)Ethiopia"},"FK":{"name":"FK","label":"(+500)Falkland Islands (Malvinas)"},"FO":{"name":"FO","label":"(+298)Faroe Islands"},"FJ":{"name":"FJ","label":"(+679)Fiji"},"FI":{"name":"FI","label":"(+358)Finland"},"FR":{"name":"FR","label":"(+33)France"},"GF":{"name":"GF","label":"(+594)French Guiana"},"PF":{"name":"PF","label":"(+689)French Polynesia"},"GA":{"name":"GA","label":"(+241)Gabon"},"GM":{"name":"GM","label":"(+220)Gambia"},"GE":{"name":"GE","label":"(+995)Georgia"},"DE":{"name":"DE","label":"(+49)Germany"},"GH":{"name":"GH","label":"(+233)Ghana"},"GI":{"name":"GI","label":"(+350)Gibraltar"},"GR":{"name":"GR","label":"(+30)Greece"},"GL":{"name":"GL","label":"(+299)Greenland"},"GD":{"name":"GD","label":"(+1 473)Grenada"},"GP":{"name":"GP","label":"(+590)Guadeloupe"},"GU":{"name":"GU","label":"(+1 671)Guam"},"GT":{"name":"GT","label":"(+502)Guatemala"},"GG":{"name":"GG","label":"(+44)Guernsey"},"GN":{"name":"GN","label":"(+224)Guinea"},"GW":{"name":"GW","label":"(+245)Guinea-Bissau"},"GY":{"name":"GY","label":"(+595)Guyana"},"HT":{"name":"HT","label":"(+509)Haiti"},"VA":{"name":"VA","label":"(+379)Holy See (Vatican City State)"},"HN":{"name":"HN","label":"(+504)Honduras"},"HK":{"name":"HK","label":"(+852)Hong Kong"},"HU":{"name":"HU","label":"(+36)Hungary"},"IS":{"name":"IS","label":"(+354)Iceland"},"IN":{"name":"IN","label":"(+91)India"},"ID":{"name":"ID","label":"(+62)Indonesia"},"IR":{"name":"IR","label":"(+98)Iran, Islamic Republic of Persian Gulf"},"IQ":{"name":"IQ","label":"(+964)Iraq"},"IE":{"name":"IE","label":"(+353)Ireland"},"IM":{"name":"IM","label":"(+44)Isle of Man"},"IL":{"name":"IL","label":"(+972)Israel"},"IT":{"name":"IT","label":"(+39)Italy"},"JM":{"name":"JM","label":"(+1 876)Jamaica"},"JP":{"name":"JP","label":"(+81)Japan"},"JE":{"name":"JE","label":"(+44)Jersey"},"JO":{"name":"JO","label":"(+962)Jordan"},"KZ":{"name":"KZ","label":"(+7 7)Kazakhstan"},"KE":{"name":"KE","label":"(+254)Kenya"},"KI":{"name":"KI","label":"(+686)Kiribati"},"KP":{"name":"KP","label":"(+850)Korea, Democratic People's Republic of Korea"},"KR":{"name":"KR","label":"(+82)Korea, Republic of South Korea"},"KW":{"name":"KW","label":"(+965)Kuwait"},"KG":{"name":"KG","label":"(+996)Kyrgyzstan"},"LA":{"name":"LA","label":"(+856)Laos"},"LV":{"name":"LV","label":"(+371)Latvia"},"LB":{"name":"LB","label":"(+961)Lebanon"},"LS":{"name":"LS","label":"(+266)Lesotho"},"LR":{"name":"LR","label":"(+231)Liberia"},"LY":{"name":"LY","label":"(+218)Libyan Arab Jamahiriya"},"LI":{"name":"LI","label":"(+423)Liechtenstein"},"LT":{"name":"LT","label":"(+370)Lithuania"},"LU":{"name":"LU","label":"(+352)Luxembourg"},"MO":{"name":"MO","label":"(+853)Macao"},"MK":{"name":"MK","label":"(+389)Macedonia"},"MG":{"name":"MG","label":"(+261)Madagascar"},"MW":{"name":"MW","label":"(+265)Malawi"},"MY":{"name":"MY","label":"(+60)Malaysia"},"MV":{"name":"MV","label":"(+960)Maldives"},"ML":{"name":"ML","label":"(+223)Mali"},"MT":{"name":"MT","label":"(+356)Malta"},"MH":{"name":"MH","label":"(+692)Marshall Islands"},"MQ":{"name":"MQ","label":"(+596)Martinique"},"MR":{"name":"MR","label":"(+222)Mauritania"},"MU":{"name":"MU","label":"(+230)Mauritius"},"YT":{"name":"YT","label":"(+262)Mayotte"},"MX":{"name":"MX","label":"(+52)Mexico"},"FM":{"name":"FM","label":"(+691)Micronesia, Federated States of Micronesia"},"MD":{"name":"MD","label":"(+373)Moldova"},"MC":{"name":"MC","label":"(+377)Monaco"},"MN":{"name":"MN","label":"(+976)Mongolia"},"ME":{"name":"ME","label":"(+382)Montenegro"},"MS":{"name":"MS","label":"(+1664)Montserrat"},"MA":{"name":"MA","label":"(+212)Morocco"},"MZ":{"name":"MZ","label":"(+258)Mozambique"},"MM":{"name":"MM","label":"(+95)Myanmar"},"NA":{"name":"NA","label":"(+264)Namibia"},"NR":{"name":"NR","label":"(+674)Nauru"},"NP":{"name":"NP","label":"(+977)Nepal"},"NL":{"name":"NL","label":"(+31)Netherlands"},"AN":{"name":"AN","label":"(+599)Netherlands Antilles"},"NC":{"name":"NC","label":"(+687)New Caledonia"},"NZ":{"name":"NZ","label":"(+64)New Zealand"},"NI":{"name":"NI","label":"(+505)Nicaragua"},"NE":{"name":"NE","label":"(+227)Niger"},"NG":{"name":"NG","label":"(+234)Nigeria"},"NU":{"name":"NU","label":"(+683)Niue"},"NF":{"name":"NF","label":"(+672)Norfolk Island"},"MP":{"name":"MP","label":"(+1 670)Northern Mariana Islands"},"NO":{"name":"NO","label":"(+47)Norway"},"OM":{"name":"OM","label":"(+968)Oman"},"PK":{"name":"PK","label":"(+92)Pakistan"},"PW":{"name":"PW","label":"(+680)Palau"},"PS":{"name":"PS","label":"(+970)Palestinian Territory, Occupied"},"PA":{"name":"PA","label":"(+507)Panama"},"PG":{"name":"PG","label":"(+675)Papua New Guinea"},"PY":{"name":"PY","label":"(+595)Paraguay"},"PE":{"name":"PE","label":"(+51)Peru"},"PH":{"name":"PH","label":"(+63)Philippines"},"PN":{"name":"PN","label":"(+872)Pitcairn"},"PL":{"name":"PL","label":"(+48)Poland"},"PT":{"name":"PT","label":"(+351)Portugal"},"PR":{"name":"PR","label":"(+1 939)Puerto Rico"},"QA":{"name":"QA","label":"(+974)Qatar"},"RO":{"name":"RO","label":"(+40)Romania"},"RU":{"name":"RU","label":"(+7)Russia"},"RW":{"name":"RW","label":"(+250)Rwanda"},"RE":{"name":"RE","label":"(+262)Reunion"},"BL":{"name":"BL","label":"(+590)Saint Barthelemy"},"SH":{"name":"SH","label":"(+290)Saint Helena, Ascension and Tristan Da Cunha"},"KN":{"name":"KN","label":"(+1 869)Saint Kitts and Nevis"},"LC":{"name":"LC","label":"(+1 758)Saint Lucia"},"MF":{"name":"MF","label":"(+590)Saint Martin"},"PM":{"name":"PM","label":"(+508)Saint Pierre and Miquelon"},"VC":{"name":"VC","label":"(+1 784)Saint Vincent and the Grenadines"},"WS":{"name":"WS","label":"(+685)Samoa"},"SM":{"name":"SM","label":"(+378)San Marino"},"ST":{"name":"ST","label":"(+239)Sao Tome and Principe"},"SA":{"name":"SA","label":"(+966)Saudi Arabia"},"SN":{"name":"SN","label":"(+221)Senegal"},"RS":{"name":"RS","label":"(+381)Serbia"},"SC":{"name":"SC","label":"(+248)Seychelles"},"SL":{"name":"SL","label":"(+232)Sierra Leone"},"SG":{"name":"SG","label":"(+65)Singapore"},"SK":{"name":"SK","label":"(+421)Slovakia"},"SI":{"name":"SI","label":"(+386)Slovenia"},"SB":{"name":"SB","label":"(+677)Solomon Islands"},"SO":{"name":"SO","label":"(+252)Somalia"},"ZA":{"name":"ZA","label":"(+27)South Africa"},"GS":{"name":"GS","label":"(+500)South Georgia and the South Sandwich Islands"},"ES":{"name":"ES","label":"(+34)Spain"},"LK":{"name":"LK","label":"(+94)Sri Lanka"},"SD":{"name":"SD","label":"(+249)Sudan"},"SR":{"name":"SR","label":"(+597)Suriname"},"SJ":{"name":"SJ","label":"(+47)Svalbard and Jan Mayen"},"SZ":{"name":"SZ","label":"(+268)Swaziland"},"SE":{"name":"SE","label":"(+46)Sweden"},"CH":{"name":"CH","label":"(+41)Switzerland"},"SY":{"name":"SY","label":"(+963)Syrian Arab Republic"},"TW":{"name":"TW","label":"(+886)Taiwan"},"TJ":{"name":"TJ","label":"(+992)Tajikistan"},"TZ":{"name":"TZ","label":"(+255)Tanzania, United Republic of Tanzania"},"TH":{"name":"TH","label":"(+66)Thailand"},"TL":{"name":"TL","label":"(+670)Timor-Leste"},"TG":{"name":"TG","label":"(+228)Togo"},"TK":{"name":"TK","label":"(+690)Tokelau"},"TO":{"name":"TO","label":"(+676)Tonga"},"TT":{"name":"TT","label":"(+1 868)Trinidad and Tobago"},"TN":{"name":"TN","label":"(+216)Tunisia"},"TR":{"name":"TR","label":"(+90)Turkey"},"TM":{"name":"TM","label":"(+993)Turkmenistan"},"TC":{"name":"TC","label":"(+1 649)Turks and Caicos Islands"},"TV":{"name":"TV","label":"(+688)Tuvalu"},"UG":{"name":"UG","label":"(+256)Uganda"},"UA":{"name":"UA","label":"(+380)Ukraine"},"AE":{"name":"AE","label":"(+971)United Arab Emirates"},"GB":{"name":"GB","label":"(+44)United Kingdom"},"US":{"name":"US","label":"(+1)United States"},"UY":{"name":"UY","label":"(+598)Uruguay"},"UZ":{"name":"UZ","label":"(+998)Uzbekistan"},"VU":{"name":"VU","label":"(+678)Vanuatu"},"VE":{"name":"VE","label":"(+58)Venezuela, Bolivarian Republic of Venezuela"},"VN":{"name":"VN","label":"(+84)Vietnam"},"VG":{"name":"VG","label":"(+1 284)Virgin Islands, British"},"VI":{"name":"VI","label":"(+1 340)Virgin Islands, U.S."},"WF":{"name":"WF","label":"(+681)Wallis and Futuna"},"YE":{"name":"YE","label":"(+967)Yemen"},"ZM":{"name":"ZM","label":"(+260)Zambia"},"ZW":{"name":"ZW","label":"(+263)Zimbabwe"}}
                            },
                            postcode: {
                                name: "postcode",
                                label: "Post code"
                            },*/
                            url: {
                                name: "url",
                                label: "Url"
                            },
                            creditcard: {
                                name: "creditcard",
                                label: "Credit Card"
                            },
                            alpha: {
                                name: "alpha",
                                label: "Alpha"
                            },
                            alphanumeric: {
                                name: "alphanumeric",
                                label: "Alphanumeric"
                            },
                            ascii: {
                                name: "ascii",
                                label: "Ascii"
                            },
                            base64: {
                                name: "base64",
                                label: "Base 64"
                            },
                            uuid: {
                                name: "uuid",
                                label: "UUID"
                            },
                            ip: {
                                name: "ip",
                                label: "IP"
                            },
                            isbn: {
                                name: "isbn",
                                label: "ISBN"
                            },
                            isin: {
                                name: "isin",
                                label: "ISIN"
                            },
                            iso8601: {
                                name: "iso8601",
                                label: "ISO8601"
                            }
                        }
                    },
                    json: {
                        name: "json",
                        label: "JSON"
                    },
                    number: {
                        name: "number",
                        label: "Number",
                        subtypes: {
                            float: {
                                name: "float",
                                label: "Float"
                            },
                            decimal: {
                                name: "decimal",
                                label: "Decimal"
                            },
                            integer: {
                                name: "integer",
                                label: "integer"
                            },
                            hexadecimal: {
                                name: "hexadecimal",
                                label: "Hexadecimal"
                            }
                        }
                    },
                    bool: {
                        name: "bool",
                        label: "Boolean"
                    },
                    date: {
                        name: "date",
                        label: "Date"
                    }
                }
            };
        },
        componentDidMount: function(){
            if(this.props.inputType){
                this.setState({selectedType: this.props.inputType});
            }
        },
        inputChanged: function(index, d, event){
            var selectedType = this.state.selectedType;
                selectedType.length = index+1; // Remove everything after the given index
                selectedType[index] = event.target.value;

                // Select the new value of the field
                var input = this.state.types[this.state.selectedType[0]];
                var selectedTypes = this.state.selectedType.slice(1);
                for (var i = 0; i < selectedTypes.length; i++) {
                    input = input.subtypes[selectedTypes[i]];
                }

                // Select the first child of the list of fields of the field
                if(typeof(input.subtypes) != "undefined"){
                    selectedType[index+1] = input.subtypes[Object.keys(input.subtypes)[0]].name;
                }

            this.setState({selectedType: selectedType});

            this.props.typeChangedForField(selectedType, this.props.name);
        },
        remove: function(name){
            this.props.remove(name);
        },
        nameInputChanged: function(name, event){
            this.props.nameInputChanged(name, event.target.value);
        },
        render: function(){
            var target = this;
            var content = "";

            if(this.state.selectedType.length){
                var input = this.state.types[this.state.selectedType[0]];
                var optionalButton = "";
                if(this.props.displayOptionalButton){
                    var checkedValue = "";
                    if(this.props.isOptional){
                        checkedValue = "checked";
                    }
                    optionalButton = (
                        <div className="label label-info checkbox" style={{borderRadius: "0px", textDecoration: "none"}}>
                            <label>
                                <input style={{position: "relative"}} type="checkbox" checked={checkedValue} checked={checkedValue} onClick={this.props.changeOptional}/>
                                &nbsp;optional
                            </label>
                        </div>);
                }

                var name = (
                    <span className="label label-primary name">{this.props.inputName}</span>
                );

                if(this.props.editable){
                    name = (
                        <div style={{background: "#1194F6", color: "white", display: "inline-block", lineHeight: "16px", height: "17px"}}>
                            <input type="text" onChange={this.nameInputChanged.bind(null, this.props.inputName)} defaultValue={this.props.inputName} style={{height: "17px", lineHeight: "17px", marginLeft: "3px", background: "#1194F6", color: "white", fontSize: "75%", fontWeight: "bold", paddingLeft: "5px", boxShadow: "none"}}/>
                        </div>
                    );
                }

                content = (
                    <span className="input">
                        <InputTypeContent index="0"
                                          value={this.state.selectedType[0]}
                                          changed={target.inputChanged.bind(null, 0)}
                                          options={_.map(Object.keys(target.state.types), function(key){
                            var row = target.state.types[key];
                            return {name: row.name, label: row.label};
                        })}/>

                        {this.state.selectedType.slice(1).map(function(row, i){
                            var index = i+1;
                            var keys = Object.keys(input.subtypes);
                            var data  = input.subtypes;
                            input = input.subtypes[row];

                            return <InputTypeContent index={index}
                                                     value={row}
                                                     changed={target.inputChanged.bind(null, index)}
                                                     key={"input"+target.props.inputName+i}
                                                     options={_.map(keys, function(key){
                                var row = data[key];
                                return {name: row.name, label: row.label};
                            })}/>;
                        })}
                        {optionalButton}
                        {name}
                        <span className="remove" style={{cursor: "pointer"}} onClick={this.remove.bind(null, this.props.inputName)}><i className="fa fa-times"></i></span>
                    </span>
                );
            }

            return content;
        }
    });
});
