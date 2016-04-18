var path   = require('path');
var async  = require('async');
var jade   = require('jade');
var fs     = require('fs');
var moment = require('moment');
var assets = require(path.normalize(__dirname + '/../helpers/assets'));
var userH  = require(path.normalize(__dirname + '/../helpers/user'));
var orm    = require(path.normalize(__dirname + '/../helpers/orm'));
var stripe = require("stripe")(assets.stripe_secret_key());

exports.home = function(req, res) {
    userH.getUserObject(req, function(user){
		if(user){
            assets.navbarButtonsState.dashboard = 'active';
		    res.render('user/billing', {
		        user: user,
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
		        navbarButtonsState: assets.navbarButtonsState,
                title: "Billing",
                description: "Add or update your payment method, find and pay your bills",
		        js: Array(
                    'libraries/loader',
                    'pages/billing',
                    'dependencies/jquery.payment.min'
                ),
		        css: Array('made-by-synchronise/custom_online',
                           'made-by-synchronise/billing'),
		        hideNormalFooter: true
		    });
		    assets.navbarButtonsStateReset();
	    }else{
            res.redirect('/?display=login&backuri=billing');
	    }
	});
};

exports.invoice = function(req, res) {
    var invoiceObject;
    var charge;
    var source;
    userH.getUserObject(req, function(user){
		if(user){
            orm.model(["UserCreditCard"]).then(function(d){
                new Promise(function(resolve, reject) {
                    stripe.invoices.retrieve(req.query.id, function(error, results){
                        if(error){reject(err);}else{invoiceObject = results; resolve();}
                    });
                }).then(function(){
                    if(invoiceObject.charge){
                        return new Promise(function(resolve, reject) {
                            stripe.charges.retrieve(invoiceObject.charge, function(error, results){
                                if(error){reject(err);}else{charge = results; resolve();}
                            });
                        });
                    }
                }).then(function(){
                    if(charge){
                        return d.UserCreditCard.cardWithSourceId(charge.source.id).then(function(sourceObject){
                            source = sourceObject;
                        });
                    }
                }).then(function(){
                    var invoice = _.extend({}, invoiceObject);
                    invoice.currency_symbol = invoice.currency_symbol || '$';
                    invoice.label_invoice = invoice.label_invoice || 'invoice';
                    invoice.label_invoice_to = invoice.label_invoice_to || 'invoice to';
                    invoice.label_invoice_by = invoice.label_invoice_by || 'invoice by';
                    invoice.label_due_on = invoice.label_due_on || 'Due on';
                    invoice.label_invoice_for = invoice.label_invoice_for || 'invoice for';
                    invoice.label_description = invoice.label_description || 'description';
                    invoice.label_unit = invoice.label_unit || 'unit';
                    invoice.label_price = invoice.label_price || 'price (' + invoice.currency_symbol + ')';
                    invoice.label_amount = invoice.label_amount || 'Amount';
                    invoice.label_subtotal = invoice.label_subtotal || 'subtotal';
                    invoice.label_total = invoice.label_total || 'total';
                    invoice.label_vat = invoice.label_vat || 'vat';
                    invoice.label_invoice_by = invoice.label_invoice_by || 'invoice by';
                    invoice.label_invoice_date = invoice.label_invoice_date || 'invoice date';
                    invoice.label_company_siret = invoice.label_company_siret || 'Company SIRET';
                    invoice.label_company_vat_number = invoice.label_company_vat_number || 'Company VAT N°';
                    invoice.label_invoice_number = invoice.label_invoice_number || 'invoice number';
                    invoice.label_reference_number = invoice.label_reference_number || 'ref N°';
                    invoice.label_invoice_due_date = invoice.label_invoice_due_date || 'Due date';
                    invoice.company_name = invoice.company_name;
                    invoice.company_address = invoice.company_address;
                    invoice.company_zipcode = invoice.company_zipcode;
                    invoice.company_city = invoice.company_city;
                    invoice.date_format = invoice.date_format || 'MMMM Do, YYYY';
                    if(source){
                        invoice.client_company_name = invoice.client_company_name || source.company + " - " + source.firstname + " " + source.surname;
                    }else{
                        invoice.client_company_name = user.username;
                    }
                    invoice.number = invoice.number || invoiceObject.id;
                    invoice.currency_position_before = invoice.currency_position_before || true;
                    invoice.date_formated = moment.unix(invoice.date).locale(invoice.language || 'en').format(invoice.date_format);
                    if(invoice.due_days && !isNaN(invoice.due_days))
                        invoice.due_date_formated = moment.unix(invoice.date).add(invoice.due_days, 'day').locale(invoice.language || 'en').format(invoice.date_format);
                    else
                        invoice.due_date_formated = invoice.date_formated;
                    invoice.pdf_name = invoice.pdf_name ? (invoice.pdf_name + '.pdf') : ('INVOICE_' + moment.unix(invoice.date).format('YYYY-MM-DD') + '_#' + invoice.number + '.pdf');

                    invoice.company_logo = path.resolve('/invoice/synchroniseSquare.png');
                    if(invoice.company_logo){
                        invoice.logo_height = 128;
                    }
                    else
                        invoice.company_logo = null;
                    _.each(invoice.lines.data, function(line){
                        if(line.type == 'subscription')
                            line.price = (line.plan.amount/100).toFixed(2);
                        else
                            line.price = (line.amount/100).toFixed(2);
                        line.amount = (line.amount/100).toFixed(2);
                        if(!line.description && line.type == 'subscription')
                        {
                            line.description = ((line.quantity > 1) ? line.quantity + ' * ' : '') + line.plan.name;
                            if(line.period)
                            {
                                line.period.start = moment.unix(line.period.start).locale(invoice.language || 'en').format(invoice.date_format);
                                line.period.end = moment.unix(line.period.end).locale(invoice.language || 'en').format(invoice.date_format);
                                line.description += ' ' + line.period.start + ' - ' + line.period.end;
                            }
                        }
                    });
                    invoice.total = (invoice.total/100).toFixed(2);
                    invoice.subtotal = (invoice.subtotal/100).toFixed(2);
                    invoice.tax_percent = invoice.tax_percent || 0;


                    var html = jade.renderFile(path.resolve(__dirname + '/../views/invoice/invoice.jade'), {
                        invoice : invoice,
                        cssRessource : [
                            path.resolve('/invoice/css/invoice.css'),
                            path.resolve('/invoice/css/foundation.min.css')
                        ]
                    });

                    //res.set('content-type', 'application/html; charset=utf-8');
                    res.send(html);
                });
            });
	    }else{
            res.redirect('/?display=login&backuri=invoice/'+req.query.id);
	    }
	});
};
