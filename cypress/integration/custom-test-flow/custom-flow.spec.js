/// <reference types="Cypress" />
import Config from "../../../app-config.json";

describe("realtime-simulation flow", () => {
    let shared_list = [];

    beforeEach(function() {
        cy.fixture("stub").as("stub");

        cy.server();
        Cypress.Cookies.preserveOnce(...Config.whiteListedCookiesKey);
        cy.restoreLocalStorage();
    });

    afterEach(() => {
        cy.saveLocalStorage();
    });

    it("Should open login page", function() {
        cy.visit(this.stub.url, {
            auth: {
                ...this.stub.creds.http,
            },
        });
        cy.route({
            url: "/manage/userauth",
            method: "POST",
        }).as("authenticate");

        cy.route({
            url: "/locales",
            method: "GET",
        }).as("localeList");

        cy.get('input[name="email"]')
            .type(this.stub.creds.user_login.username)
            .should("have.value", this.stub.creds.user_login.username);

        cy.get('input[name="password"]')
            .type(this.stub.creds.user_login.password)
            .should("have.value", this.stub.creds.user_login.password);
        cy.get("button").click();

        cy.wait("@authenticate", { timeout: 15000 }).should(function(resp) {
            expect(resp.status).equal(200);

            // Cypress.Cookies.preserveOnce(...Config.whiteListedCookiesKey);
            /**
             *  Assertion for all the response expected and received from API
             */

            /**
             * Tenant code should be 1 for my loggedIn user
             */
            expect(resp.response.body.shared_list.length).equal(1);
        });
        cy.wait("@localeList", { timeout: 15000 });
        cy.get("@localeList").then(function(resp) {
            expect(resp.status).equal(200);
            console.log("Response", resp);
            shared_list = resp.response.body;
            expect(resp.response.body.length).greaterThan(0);
        });
    });

    it("On login it should redirect to /home", function() {
        // replace by id
        cy.url().should("equal", `${this.stub.url}/home`);
    });

    it(`Should have list of locales equal to  received from BE`, function() {
        cy.get("#home_keywordSearch_locale_dropdown_button").click();

        cy.get(".css-1qpdzfw-menu")
            .find(".css-jb6glx-option")
            .should("have.length", shared_list.length - 1);
    });

    it("Tenant list should be scrollable", function() {
        cy.get(".css-mrtax3-MenuList").scrollIntoView({ easing: "linear" });
    });

    it("Should have input to search for locales", function() {
        cy.wait(2000);

        cy.get("#react-select-4-input")
            .focus()
            .type(this.stub.pages.home.locale)
            .get(".css-mrtax3-MenuList")
            .children()
            .should("have.length", 1)
            .click();
    });

    it("Should select the locales from the list and make it default selected", function() {
        cy.get("#home_keywordSearch_locale_dropdown_button").contains(
            this.stub.pages.home.locale,
        );
    });

    it("Should have input for keyword input", function() {
        cy.get("#home_keywordSearch_keyword_input")
            .should("have.length", 1)
            .focus()
            .type(this.stub.pages.home.keyword)
            .should("have.value", this.stub.pages.home.keyword);
    });

    it("Should have protocol dropdown, should have only 2 options", function() {
        cy.get("#home_keywordSearch_protocol_dropdown")
            .should("have.length", 1)
            .click()
            .children(".css-2pcq7v-menu")
            .children(".css-mrtax3-MenuList")
            .children()
            .should("have.length", 2)
            .contains(this.stub.pages.home.protocolOptions[0])
            .contains(this.stub.pages.home.protocolOptions[1])
            .click();
    });

    it("Should select option as default when option is clicked", function() {
        cy.get("#home_keywordSearch_protocol_dropdown span").contains(
            this.stub.pages.home.protocolOptions[0],
        );
    });

    it("Should have domain input", function() {
        cy.get("#home_keywordSearch_domain_input")
            .should("have.length", 1)
            .clear()
            .focus()
            .type(this.stub.pages.home.domain)
            .should("have.value", this.stub.pages.home.domain);
    });

    it("Should make a default option when dropdown is selected", function() {
        cy.get("#home_keywordSearch_domain_dropdown")
            .contains(this.stub.pages.home.defaultDomainTyle)
            .click()
            .get(".css-2pcq7v-menu")
            .get(".css-mrtax3-MenuList")
            .children()
            .should("have.length", 2)
            .get("#react-select-3-option-0")
            .contains(this.stub.pages.home.domainType[0])
            .get("#react-select-3-option-1")
            .contains(this.stub.pages.home.domainType[1])
            .click();
    });
    it("Should contain the selected domain type", function() {
        cy.get("#home_keywordSearch_domain_dropdown").contains(
            this.stub.pages.home.domainType[1],
        );
    });
    it("Should have Go button", function() {
        cy.route("POST", "/refresh_keyword").as(
            "intitiateTrack",
        );
        cy.get("#home_keywordSearch_submit_button")
            .should("have.length", 1)
            .click()
            .wait("@intitiateTrack");

        cy.get("@intitiateTrack").then(function(resp) {
            expect(resp.status).to.equal(200);
            cy.wrap(resp)
                .its("response.body")
                .should("have.any.keys", "req_id")
                .should("be.ok");
        });
    });
    // it("Should redrect to serp-page when requestid is received");
});
