"use strict";

var formContext;

function onLoad(executionContext) {
    formContext = executionContext.getFormContext();
}

function setStatesBehviour(executionContext) {
    var usStatesFields = "cr05a_usstatealabama,cr05a_usstatecalifornia,cr05a_usstateflorida,cr05a_usstatenewyork,cr05a_usstatewashington";
    var indiaStatesFields = "cr05a_indiastategoa,cr05a_indiastatekarnataka,cr05a_indiastatekerala,cr05a_indiastatemaharashtra,cr05a_indiastatetamilnadu";

    var pickedState = "";
    var triggerField = executionContext.getEventSource().getName();

    if (formContext.getAttribute(triggerField) !== null && formContext.getAttribute(triggerField).getValue() === true) {
        pickedState = triggerField;
    }
    else {
        setFieldsDisabled(indiaStatesFields + "," + usStatesFields, false);
    }
    

    if (pickedState !== "") {
        if (usStatesFields.includes(pickedState)) {
            clearFields(indiaStatesFields);
            setFieldsDisabled(indiaStatesFields, true);

            var usStatesFieldsToClear = usStatesFields.replace(pickedState, "");
            clearFields(usStatesFieldsToClear);
        }
        else {
            clearFields(usStatesFields);
            setFieldsDisabled(usStatesFields, true);

            var indiaStatesFieldsToClear = indiaStatesFields.replace(pickedState, "");
            clearFields(indiaStatesFieldsToClear);
        }
    }


}

function clearFields(fieldsString) {
    var fieldsArray = fieldsString.split(",");
    for (field of fieldsArray) {
        if (formContext.getAttribute(field) !== null) {
            formContext.getAttribute(field).setValue(false);
        }
    }
}

function setFieldsDisabled(fieldsString, isDisabled) {
    var fieldsArray = fieldsString.split(",");
    for (field of fieldsArray) {
        if (formContext.getAttribute(field) !== null) {
            formContext.getControl(field).setDisabled(isDisabled);
        }
    }
}

function onSave(executionContext) {
    formContext = executionContext.getFormContext();
    
    if (formContext.ui.getFormType() === 2) {
        if (formContext.getAttribute("cr05a_contactlastname") !== null && formContext.getAttribute("cr05a_contactemailaddress") !== null) {
            if (formContext.getAttribute("cr05a_contactlastname").getValue() === null || formContext.getAttribute("cr05a_contactemailaddress").getValue() === null) {
                alert("Please enter Last Name and Email Address");
                executionContext.getEventArgs().preventDefault();
            }
            else {
                var firstName = formContext.getAttribute("cr05a_contactfirstname");
                var lastName = formContext.getAttribute("cr05a_contactlastname");
                var email = formContext.getAttribute("cr05a_contactemailaddress");
                var phone = formContext.getAttribute("cr05a_contacthomephone");

                var entity = {};

                if (firstName !== null) {
                    entity.firstname = firstName.getValue();
                }

                if (lastName !== null) {
                    entity.lastname = lastName.getValue();
                }

                if (email !== null) {
                    entity.emailaddress1 = email.getValue();
                }

                if (phone !== null) {
                    entity.telephone1 = phone.getValue();
                }

                Xrm.WebApi.createRecord("contact", entity).then(
                    function success(result) {
                        associateNToN("accounts", formContext.data.entity.getId(), "contacts", result.id, "cr05a_account_contact");
                    },
                    function (error) {
                        console.log(error.message);
                    }
                );
            }
        }
    }
}

function associateNToN(primaryEntityPluralName, primaryEntityId, relatedEntityPluralName, relatedEntityId, n2nRelationName) {
   
    primaryEntityId = primaryEntityId.replace(/\{|\}/gi, '');
    relatedEntityId = relatedEntityId.replace(/\{|\}/gi, '');

    var globalContext = Xrm.Utility.getGlobalContext();
    var clientUrl = globalContext.getClientUrl();
 
    var association = {};
    association["@odata.id"] = clientUrl + "/api/data/v8.2/" + relatedEntityPluralName + "(" + relatedEntityId + ")";
 
    var req = new XMLHttpRequest();
    req.open("POST", clientUrl + "/api/data/v8.2/" + primaryEntityPluralName + "(" + primaryEntityId + ")/" + n2nRelationName + "/$ref", true);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
 
    req.onreadystatechange = function () {
        if (this.readyState === 4) {
            req.onreadystatechange = null;
            if (this.status === 204 || this.status === 1223) {
                //Success - No Return Data - Do Something
            }
            else if (this.status === 412) {
                if (this.responseText != null && this.responseText != undefined) {
                    var errorResponse = JSON.parse(this.responseText);
                    if (errorResponse['error'] != null && errorResponse['error'] != undefined) {
                        if (errorResponse['error']['message'] != null && errorResponse['error']['message'] != undefined) {
                            var errorMessage = errorResponse['error']['message'];
                            console.log(errorMessage);
                        }
                    }
                }
            }
            else {
                console.log(this.statusText);
            }
        }
    };
 
    req.send(JSON.stringify(association));
}