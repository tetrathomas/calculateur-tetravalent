var CalculsDetailles = false;

class Operateur {
    static GetFromClasse(classe) {
        switch (classe) {
            case 'not': return OperateurNot; break;
            case 'egalstrict': return OperateurEgalStrict; break;
            case 'egalflou': return OperateurEgalFlou; break;
            case 'implique': return OperateurImplique; break;
        }
        return null;
    }
    constructor(arite, valeurs, nom, symbole) {
        this.Arite = arite;
        this.Valeurs = valeurs;
        this.Nom = nom;
        this.Symbole = symbole;
    }
    Calculer($explications, args) { // args peut être un tableau d'objets calculables ou bien un tableau de valeurs
        var resultat;
        var valeursArgs = [];
        if (args)
            for (var a of args) {
                if (a instanceof Object)
                    valeursArgs.push(a.Calculer($explications));
                else
                    valeursArgs.push(a);
            }
        switch (this.Arite) {
            case 0: resultat = this.Valeurs; break;
            case 1: resultat = this.Valeurs[valeursArgs[0]]; break;
            case 2: resultat = this.Valeurs[valeursArgs[0]][valeursArgs[1]]; break;
        }
        if ($explications && CalculsDetailles && this.Arite >= 0)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur les arguments ' + valeursArgs.map(function(v) {return libellesValeurs[v]}).join(',') + ' :' + libellesValeurs[resultat] + '<br>');
        return resultat;
    }
    ToString() {
        if (this.Arite == 0) return libellesValeurs[this.Valeurs];
        return this.Nom;
    }
    ToStringABC() { // Renvoie !A pour ou A => B
        switch (this.Arite) {
            case 0: return libellesValeurs[this.Valeurs];
            case 1: return this.Symbole + 'A';
            case 2: return 'A' + this.Symbole + 'B';
        }
        return '';
    }
}


function Complement(valeurs) {
    var output = [];
    if (!(valeurs instanceof Array)) valeurs = [valeurs];
    for (var i=0; i<4; i++) if (!valeurs.includes(i)) output.push(i);
    return output;
}
function Intersection(valeurs1, valeurs2) {
    var output = [];
    if (!(valeurs1 instanceof Array)) valeurs1 = [valeurs1];
    if (!(valeurs2 instanceof Array)) valeurs2 = [valeurs2];
    for (var i=0; i<4; i++) if (valeurs1.includes(i) && valeurs2.includes(i)) output.push(i);
    return output;
}

function ArrayValeurToString(valeurs) {
    if (valeurs instanceof Array)
        return '{' + valeurs.map(function(v) {return libellesValeurs[v]}).join(',') + '}';
    else
        return libellesValeurs[valeurs];
}
class OperateurMultivaleur extends Operateur {
    constructor(ensembleValeurs) {
        super(0, [] , 'V+');
        this.EnsembleValeurs = ensembleValeurs;
    }
    Calculer($explications) {
        return this.EnsembleValeurs;
    }
    ToString() {
        return ArrayValeurToString(this.EnsembleValeurs);
    }
}

class OperateurNotMulti extends Operateur {
    constructor() {
        super(1, [] , 'Not');
    }
    Calculer($explications, args) {
        var resultat;
        var input = args[0].Calculer($explications);
        var output = Complement(input);
        if ($explications && CalculsDetailles)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur ' + ArrayValeurToString(input) + ' : ' + ArrayValeurToString(output) +'<br>');
        return output;
    }
}

class OperateurDireveriteMulti extends Operateur {
    constructor() {
        super(2, [] , 'Direverite');
    }
    Calculer($explications, args) {
        var resultat;
        var input1 = args[0].Calculer($explications);
        var input2 = args[1].Calculer($explications);
        if (input1 instanceof Array) { // Branches !

        } else { // Pas branches !
            switch (input1) {
                case 0: resultat = Complement(input2); break;
                case 1: resultat = input2; break;
                case 2: resultat = []; break;
                case 3: resultat = [0, 1, 2, 3]; break;
            }
        }
        if ($explications && CalculsDetailles && this.Arite >= 0)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur les arguments ' + input1 + ' et ' + ArrayValeurToString(input2) + ' : ' + ArrayValeurToString(resultat) + '<br>');
        return resultat;
    }
}

class OperateurOuMulti extends Operateur {
    constructor() {
        super(2, [] , 'OU');
    }
    Calculer($explications, args) {
        var resultat = [];
        var input1 = args[0].Calculer($explications);
        var input2 = args[1].Calculer($explications);
        if (input1 instanceof Array && input2 instanceof Array) { // Branches !

        } else if (input1 instanceof Array && !(input2 instanceof Array)) { // Pas branches
            for (var v1 of input1)
                resultat.push(OperateurOu.Calculer($explications, [v1, input2]));
            resultat = Uniquifier(resultat);
        } else if (!(input1 instanceof Array) && input2 instanceof Array) { // Pas branches
            for (var v2 of input2)
                resultat.push(OperateurOu.Calculer($explications, [input1, v2]));
            resultat = Uniquifier(resultat);
        } else { // input1 et input2 sont des valeurs simples
            resultat.push(OperateurOu.Calculer($explications, [input1, input2]));
        }
        if ($explications && CalculsDetailles && this.Arite >= 0)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur les arguments ' + input1 + ' et ' + ArrayValeurToString(input2) + ' : ' + ArrayValeurToString(resultat) + '<br>');
        return resultat;
    }
}

class OperateurEtMulti extends Operateur {
    constructor() {
        super(2, [] , 'OU');
    }
    Calculer($explications, args) {
        var resultat = [];
        var input1 = args[0].Calculer($explications);
        var input2 = args[1].Calculer($explications);
        if (input1 instanceof Array && input2 instanceof Array) { // Branches !

        } else if (input1 instanceof Array && !(input2 instanceof Array)) { // Pas branches
            for (var v1 of input1)
                resultat.push(OperateurEt.Calculer($explications, [v1, input2]));
            resultat = Uniquifier(resultat);
        } else if (!(input1 instanceof Array) && input2 instanceof Array) { // Pas branches
            for (var v2 of input2)
                resultat.push(OperateurEt.Calculer($explications, [input1, v2]));
            resultat = Uniquifier(resultat);
        } else { // input1 et input2 sont des valeurs simples
            resultat.push(OperateurEt.Calculer($explications, [input1, input2]));
        }
        if ($explications && CalculsDetailles && this.Arite >= 0)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur les arguments ' + input1 + ' et ' + ArrayValeurToString(input2) + ' : ' + ArrayValeurToString(resultat) + '<br>');
        return resultat;
    }
}

class OperateurEgalStrictMulti extends Operateur {
    constructor() {
        super(2, [] , '==');
    }
    Calculer($explications, args) {
        var resultat=0;
        var input1 = args[0].Calculer($explications);
        var input2 = args[1].Calculer($explications);
        if (!(input1 instanceof Array)) input1 = [input1];
        if (!(input2 instanceof Array)) input2 = [input2];
        for (var i1 of input1)
            for (var i2 of input2)
                if (i1 == i2)
                    resultat = 1;
        if ($explications && CalculsDetailles && this.Arite >= 0)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur les arguments ' + input1 + ' et ' + ArrayValeurToString(input2) + ' : ' + ArrayValeurToString(resultat) + '<br>');
        return resultat;
    }
}



class Proposition {
    constructor(operateur, args) {
        this.Operateur = operateur;
        this.Arguments = (args == undefined) ? [] : args;
    }
    GetVariables() {
        var variables = [];
        for (var a of this.Arguments) {
            if (a instanceof Variable) variables.push(a);
            if (a instanceof Proposition) variables.push(...a.GetVariables()); // TODO : protection contre les boucles de récursion
        }
        return Uniquifier(variables);
    }
    GetVariablesEtConstantes() {
        var variablesEtConstantes = [];
        if (this.Operateur.Arite == 0) variablesEtConstantes.push(this.Operateur);
        for (var a of this.Arguments) {
            if (a instanceof Variable) variablesEtConstantes.push(a);
            if (a instanceof Operateur && a.Arite == 0) variablesEtConstantes.push(a);
            if (a instanceof Proposition) variablesEtConstantes.push(...a.GetVariablesEtConstantes()); // TODO : protection contre les boucles de récursion
        }
        return Uniquifier(variablesEtConstantes);
    }
    TrouverVariablePropositionDansArguments() { // Recherche si la proposition en cours a deux arguments, dont l'un serait une proposition et l'autre une variable, et les renvoie dans le bon ordre
        if (this.Operateur.Arite == 2) {
            var variable, proposition;
            if (this.Arguments[0] instanceof Variable && this.Arguments[1] instanceof Proposition) {
                variable = this.Arguments[0];
                proposition = this.Arguments[1];
            }
            if (this.Arguments[1] instanceof Variable && this.Arguments[0] instanceof Proposition) {
                variable = this.Arguments[1];
                proposition = this.Arguments[0];
            }
            if (variable != undefined) return [variable, proposition];
        }
        return [null, null];
    }
    ChercherDependancesVariables() {
        if (this.Operateur === OperateurEgalStrict || this.Operateur instanceof OperateurEgalStrictMulti) {
            var [variable, proposition] = this.TrouverVariablePropositionDansArguments();
            if (variable != null) {
                variable.Dependances.push(...proposition.GetVariablesEtConstantes());
                proposition.ChercherDependancesVariables(); // TODO : protection contre les boucles de récursion
            }
        }
    }
    EstDetermineePar(variables) {
        if (this.Operateur === OperateurEgalStrict || this.Operateur instanceof OperateurEgalStrictMulti) {
            var [variable, proposition] = this.TrouverVariablePropositionDansArguments();
            if (variable != null) {
                if (variables.includes(variable)) return false; // Cette proposition a pour variable d'affectation une des variables passées en paramètre, on considère qu'elle n'est pas déterminée par
                var variablesProposition = proposition.GetVariables();
                var determinee = true;
                for (var vp of variablesProposition)
                    if (!variables.includes(vp))
                        determinee = false;
                return determinee;
            }
        } else {
            // TODO : arrêter de ne savoir travailler qu'avec les égalités (à réfléchir)
        }
        return false;
    }
    Calculer($explications) {
        return this.Operateur.Calculer($explications, this.Arguments);
    }
    ToString() {
        var str = this.Operateur.ToString();
        if (this.Arguments.length > 0) {
            str += '(';
            str += this.Arguments.map(function(e) { return e.ToString(); }).join(', ');
            str += ')';
        }
        return str;
    }
}
class Variable {
    constructor(nom) {
        this.Nom = nom;
        this.Valeur = undefined;
    }
    Calculer() {
        return this.Valeur;
    }
    ToString() {
        return this.Nom;
    }
}

class Probleme {

    constructor(args) {
        this.Nom = args.Nom;
        this.Description = args.Description;
        this.Propositions = args.Propositions;
        this.Formule = args.Formule;
        this.EstActif = false;
        this.Variables = undefined; // Contiendra les variables dans un ordre arbitraire mais fixe, une fois qu'on les aura découvertes
    }

    ToString() {
        return this.Propositions.map(function(p) {return p.ToString()}).join (' ; ');
    }

    GetVariables() {
        if (this.Variables === undefined) { // On suppose que le problème est fixe, et les variables ne changent pas au cours de la vie de l'objet Probleme
            var variables = [];
            for (var p of this.Propositions) {
                variables.push(...p.GetVariables());
            }
            this.Variables = Uniquifier(variables);
        }
        return this.Variables;
    }

    Resoudre() {
        var $solutions = this.$div.find('p.solutions');
        var $explications = this.$div.find('.explications .details');
        this.Solutions = [];
        $explications.html('');
        $('.tableverite tr.header').append('<th>' + this.Formule + '</th>');
        $explications.append('Début de la résolution du problème.<br>');
        $explications.append('Description du problème : ' + this.ToString() + '.<br>');
        $explications.append('Recherche des variables.<br>');
        this.GetVariables(); // Remplit this.Variables
        $explications.append('Variables trouvées (' + this.Variables.length + ') : ' + this.Variables.map(function(v) {return v.Nom}).join(', ') + '<br>');
        this.InitialiserVariables();
        this.Variables[0].Valeur = -1; // Pour passer le premier while
        while(this.IncrementerVariable(0)) {
            $explications.append('Calcul des propositions avec les valuations suivantes : ' + this.Variables.map(function(v) {return v.Nom + '::' + libellesValeurs[v.Valeur];}).join(', ') + '<br>');
            var toutesvraies = true;
            for (var ip in this.Propositions) {
                var p = this.Propositions[ip];
                var vp = p.Calculer($explications);
                $explications.append('La proposition ' + ip + ' prend la valeur ' + libellesValeurs[vp] + '<br>');
                if (vp != 1) toutesvraies = false;
            }
            var selecteur = '';
            for (var iv in this.Variables) {
                var v = this.Variables[iv]
                selecteur += '[' + String.fromCharCode(97+parseInt(iv,10)) + '=' + v.Valeur + ']';
            }
            $('.tableverite tr' + selecteur).append('<td>' + libellesValeurs[toutesvraies ? 1 : 0] + '</td>');
            if (toutesvraies) {
                this.Solutions.push(this.Variables.map(function(v) {return v.Valeur}));
            }
        }
        $solutions.html('Solutions trouvées (' + this.Solutions.length + ') : <br>'
            + this.Variables.map(function(v) {return v.Nom}).join(', ') + '<br>'
            + this.Solutions.map(function(s) {return s.map(function(v) {return libellesValeurs[v]}).join(',') }).join('<br>'));
    }
    InitialiserVariables() {
        for (var v of this.Variables) v.Valeur = 0;
    }
    IncrementerVariable(i) {
        var v = this.Variables[i];
        v.Valeur++;
        if (v.Valeur >= 4) {
            if (i >= this.Variables.length-1) return false; // Dernière valeur de la dernière variable
            v.Valeur = 0;
            return this.IncrementerVariable(i+1);
        } else {
            return true;
        }
    }
    SolutionExiste(solution) {
        prochaineSolExistante:
        for (var solExistante of this.Solutions) {
            for (var i=0; i<solExistante.length; i++)
                if (solExistante[i] != solution[i])
                    continue prochaineSolExistante;
            return true;
        }
        return false;
    }

    ToHtml() {
        if (this.EstActif) {
            var html = '<div class="probleme"><div class="reduire" tip="Réduire">▼</div>';
            html += '<h3 class="propositions">' + this.Formule + '</h3>';
            html += '<p class="enonce">' + this.Description + '</p>';
            html += '<p class="solutions"></p>';
            html += '<div class="explications"><h4>Voir les explications</h4><p class="details"></p></div>';
            html += '</div>';
            return html;
        } else {
            var html = '<div class="probleme"><div class="augmenter" tip="Calculer">⏵</div>';
            html += '<h3 class="propositions" tip="' + this.Description + '">' + this.Formule + '</h3>';
            html += '</div>';
            return html;
        }
    }
    Reduire() {
        this.EstActif = false;
        this.$div.remove();
        this.InjectHtml();
    }
    Augmenter() {
        this.EstActif = true;
        this.$div.remove();
        this.InjectHtml();
        this.Resoudre();
    }
    InjectHtml() {
        var $parent = this.EstActif ? $('div.problemes'): $('div.problemesdisponibles');
        $parent.append(this.ToHtml());
        this.$div = $parent.children('div.probleme:last');

        BrancherTooltips(this.$div);
        AfficherLibellesOperateurs(this.$div);
        AfficherLibellesValeurs(this.$div);

        // Masquer les explications par défaut et les rendre montrables
        if (this.EstActif) {

            this.$div.find('div.explications').each(function () {
                var $explications = $(this);
                $explications.find('.details').hide();
                $explications.find('h4').css('cursor', 'pointer').on('click', function () {
                    $explications.find('.details').toggle();
                });
            });

            // Clic sur le bouton réduire
            var thisProbleme = this;
            this.$div.find('.reduire').on('click', function() {
                thisProbleme.Reduire();
            });

        } else {

            // Clic sur le bouton augmenter
            var thisProbleme = this;
            this.$div.find('.augmenter').on('click', function() {
                thisProbleme.Augmenter();
            });

        }

    }
}

class ProblemeMultivalue extends Probleme {

    constructor(args) {
        super(args);
    }

    Resoudre() {
        var $solutions = this.$div.find('p.solutions');
        var $explications = this.$div.find('.explications .details');
        this.Solutions = [];
        $explications.html('');
        $explications.append('Début de la résolution du problème.<br>');
        $explications.append('Description du problème : ' + this.ToString() + '.<br>');
        $explications.append('Recherche des variables.<br>');
        this.Variables = this.GetVariables();
        $explications.append('Variables trouvées (' + this.Variables.length + ') : ' + this.Variables.map(function(v) {return v.Nom}).join(', ') + '<br>');

        $explications.append('Construction du graphe de dépendance des variables.<br>');
        for (var v of this.Variables) v.Dependances = [];
        for (var p of this.Propositions) {
            p.ChercherDependancesVariables();
        }
        this.VariablesLibres = []
        for (var v of this.Variables) {
            v.Dependances = Uniquifier(v.Dependances);
            $explications.append('La variable ' + v.Nom + ' est dépendante de : ' + v.Dependances.map(function(v) {return v.Nom}).join(', ') + '.<br>');
            if (v.Dependances.length == 0) this.VariablesLibres.push(v);
        }
        $explications.append('Variables libres trouvées (' + this.VariablesLibres.length + ') : ' + this.VariablesLibres.map(function(v) {return v.Nom}).join(', ') + '<br>');

        this.InitialiserVariables();
        if (this.VariablesLibres.length > 0) {
            this.VariablesLibres[0].Valeur = -1; // Pour passer le premier while
            while (this.IncrementerVariable(0)) {
                $explications.append('Calcul avec les valuations suivantes : ' + this.VariablesLibres.map(function (v) {
                    return v.Nom + '::' + libellesValeurs[v.Valeur];
                }).join(', ') + '<br>');
                this.ResoudreEnForcant([], [], $explications, '');
            }
        } else { // Aucune variable libre
            this.ResoudreEnForcant([], [], $explications, '');
        }
        $solutions.html('Solutions trouvées (' + this.Solutions.length + ') : <br>'
            + this.Variables.map(function(v) {return v.Nom}).join(', ') + '<br>'
            + this.Solutions.map(function(s) {return s.map(function(v) {return libellesValeurs[v]}).join(',') }).join('<br>'));
    }

    VerifierSolution(solution) {
        for (var iv in this.Variables) this.Variables[iv].Valeur = solution[iv];
        for (var p of this.Propositions) {
            if (p.Calculer() != 1) return false;
        }
        return true;
    }

    ResoudreEnForcant(variablesForcees, valeursForcees, $explications, nomBranche) {

        // Chercher les propositions qui sont déterminées par les variables forcées
        for (var i in variablesForcees) variablesForcees[i].Valeur = valeursForcees[i];
        var variablesValorisees = [...this.VariablesLibres, ...variablesForcees];

        if (nomBranche) {
            $explications.append('<br>Entrée dans la branche ' + nomBranche + ' ');
            $explications.append('(' + variablesValorisees.map(function (v) {
                return v.Nom + '::' + libellesValeurs[v.Valeur];
            }).join(', ') + '). ');
            $explications.append('<br>');
        }

        var valeursSolutions;
        for (var ip in this.Propositions) {
            var p = this.Propositions[ip];
            if (p.EstDetermineePar(variablesValorisees)) {
                $explications.append(nomBranche + ' Examen de la proposition ' + ip + ' : ' + p.ToString() + '<br>');
                var [variableaffectation, sousproposition] = p.TrouverVariablePropositionDansArguments();
                var vals = sousproposition.Calculer($explications);
                $explications.append(nomBranche + ' Selon la proposition ' + ip + ', ' + variableaffectation.Nom + ' peut prendre les valeurs' + ArrayValeurToString(vals) + '.<br>');
                if (vals.length > 0) {
                    if (variablesValorisees.length == this.Variables.length - 1) { // On a tout valorisé
                        if (valeursSolutions === undefined)
                            valeursSolutions = vals;
                        else
                            valeursSolutions = Intersection(valeursSolutions, vals);
                    } else {
                        $explications.append(nomBranche + ' Création de ' + vals.length + ' branches de calcul.<br>');
                        for (var i in vals) {
                            var val = vals[i];
                            this.ResoudreEnForcant([...variablesForcees, variableaffectation], [...valeursForcees, val], $explications, ((nomBranche != '') ? (nomBranche + '-') : '') + (parseInt(i, 10) + 1).toString());
                        }
                    }
                }
            }
        }
        if (valeursSolutions !== undefined && variablesValorisees.length == this.Variables.length - 1) { // On a tout valorisé
            for (var val of valeursSolutions) {
                var solution = [];
                for (var v of this.Variables) solution.push(variablesValorisees.includes(v) ? v.Valeur : val); // Dans l'ordre des Variables du Probleme
                if (this.VerifierSolution(solution)) {
                    if (this.SolutionExiste(solution)) {
                        $explications.append(nomBranche + ' Solution déjà existante trouvée : ' + solution.map(function (v) { return libellesValeurs[v] }).join(',') + '<br>');
                    } else {
                        $explications.append(nomBranche + ' Nouvelle solution trouvée : ' + solution.map(function (v) { return libellesValeurs[v] }).join(',') + '<br>');
                        this.Solutions.push(solution);
                    }
                }
            }
        }
    }

    InitialiserVariables() {
        for (var v of this.VariablesLibres) v.Valeur = 0;
    }
    IncrementerVariable(i) {
        var v = this.VariablesLibres[i];
        v.Valeur++;
        if (v.Valeur >= 4) {
            if (i >= this.VariablesLibres.length-1) return false; // Dernière valeur de la dernière variable
            v.Valeur = 0;
            return this.IncrementerVariable(i+1);
        } else {
            return true;
        }
    }

}

var Uniquifier = function(tableau) {
    return [...new Set(tableau)];
}


var JeuxLibellesValeurs = {
    'Thomas': ['0', '1', 'A', 'T'],
    'Norman': ['F', 'T', 'N', 'B'],
    'Ummo': ['AÏOOYEEDOO', 'AÏOOYAA', 'AÏOOYA AMMIÈ', 'AÏOOYAOU'],
    'Booléen': ['0^!1', '!0^1', '!0^!1', '0^1'],
};

var JeuxDefinitionsOperateurs = {
    'Thomas': {
        'Not':[1,0,2,3],
        'EgalStrict':[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
        'EgalFlou':[[1,0,2,3],[0,1,2,3],[2,2,1,0],[3,3,0,1]],
        'Implique':[[1,1,1,1],[0,1,2,3],[2,1,1,0],[3,1,0,1]],
        'Ou':[[0,1,0,3],[1,1,1,3],[0,1,2,3],[3,3,3,3]],
        'Et':[[0,0,2,0],[0,1,2,1],[2,2,2,2],[0,1,2,3]],
    }
}

var V0 = new Operateur(0, 0);
var V1 = new Operateur(0, 1);
var V2 = new Operateur(0, 2);
var V3 = new Operateur(0, 3);
var OperateurNot = new Operateur(1, JeuxDefinitionsOperateurs.Thomas.Not, 'Not', '!');
var OperateurEgalStrict = new Operateur(2, JeuxDefinitionsOperateurs.Thomas.EgalStrict, 'Egal strict', '==');
var OperateurEgalFlou = new Operateur(2, JeuxDefinitionsOperateurs.Thomas.EgalFlou, 'Egal flou', '=');
var OperateurImplique = new Operateur(2, JeuxDefinitionsOperateurs.Thomas.Implique, 'Implique', '=>');
var OperateurOu = new Operateur(2, JeuxDefinitionsOperateurs.Thomas.Ou, 'OU', '=>');
var OperateurEt = new Operateur(2, JeuxDefinitionsOperateurs.Thomas.Et, 'ET', '=>');


var libellesValeurs = JeuxLibellesValeurs['Thomas'];

var Problemes = [];
var p = new Variable('P');
var p1 = new Variable('P1');
var p2 = new Variable('P2');
var p3 = new Variable('P3');
var a = new Variable('A');
var b = new Variable('B');
var c = new Variable('C');
Problemes.push(new Probleme({
    Nom: 'Identité',
    Formule: 'P <span class="egalstrict"></span> P',
    Description: 'Problème de l\'identité, une proposition est-elle équivalente à elle-même',
    Propositions: [new Proposition(OperateurEgalStrict, [p,p])]
}));
Problemes.push(new Probleme({
    Nom: 'Double négation',
    Formule: 'P <span class="egalstrict"></span> <span class="not"></span> <span class="not"></span> P',
    Description: 'Problème de l\'identité après double négation',
    Propositions: [new Proposition(OperateurEgalStrict, [p,
        new Proposition(OperateurNot, [new Proposition(OperateurNot, [p])])
    ])]
}));
Problemes.push(new Probleme({
    Nom: 'Négation',
    Formule: 'P <span class="egalflou"></span> <span class="not"></span> P',
    Description: 'Problème de l\'identité après simple négation',
    Propositions: [new Proposition(OperateurEgalFlou, [p, new Proposition(OperateurNot, [p])])]
}));
Problemes.push(new Probleme({
    Nom: 'Egalité stricte',
    Formule: 'P1 <span class="egalstrict"></span> P2',
    Description: 'Problème de l\'identité stricte de deux propositions indépendantes (test trivial des problèmes à plusieurs variables',
    Propositions: [new Proposition(OperateurEgalStrict, [p1, p2])]
}));
Problemes.push(new Probleme({
    Nom: 'implication réflexive',
    Formule: 'P <span class="implique"></span> P',
    Description: 'Problème de la réflexivité de l\'opérateur implication',
    Propositions: [new Proposition(OperateurImplique, [p, p])]
}));
Problemes.push(new Probleme({
    Nom: 'Contraposition',
    Formule: '(A <span class="implique"></span> B) <span class="egalstrict"></span> (<span class="not"></span> B <span class="implique"></span> <span class="not"></span> A)',
    Description: 'Problème de la contraposition de deux variables indépendantes',
    Propositions: [new Proposition(OperateurEgalStrict, [
        new Proposition(OperateurImplique, [a, b]),
        new Proposition(OperateurImplique, [new Proposition(OperateurNot, [b]), new Proposition(OperateurNot, [a])]),
    ])]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 2',
    Formule: 'P1 <span class="egalflou"></span> </span> <span class="not"></span> P2 ; P2 <span class="egalflou"></span> </span> <span class="not"></span> P1',
    Description: 'Alice dit que Bob ment ; Bob dit que Alice ment',
    Propositions: [
        new Proposition(OperateurEgalFlou, [a, new Proposition(OperateurNot, [b])]),
        new Proposition(OperateurEgalFlou, [b, new Proposition(OperateurNot, [a])])
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 3',
    Formule: 'P1 <span class="egalflou"></span> </span> <span class="not"></span> P2 ; P2  <span class="egalflou"></span> </span> <span class="not"></span> P3 ; P3  <span class="egalflou"></span> </span> <span class="not"></span> P1',
    Description: 'Alice dit que Bob ment ; Bob dit que Clara ment ; Clara dit que Alice ment',
    Propositions: [
        new Proposition(OperateurEgalFlou, [a, new Proposition(OperateurNot, [b])]),
        new Proposition(OperateurEgalFlou, [b, new Proposition(OperateurNot, [c])]),
        new Proposition(OperateurEgalFlou, [c, new Proposition(OperateurNot, [a])])
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 3, variante',
    Formule: 'P1 <span class="egalstrict"></span> (P2 <span class="egalflou"></span> <span class="v0"></span>) ; P2 <span class="egalstrict"></span> (P3 <span class="egalflou"></span> <span class="v0"></span>) ; P3 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v2"></span>)',
    Description: 'Alice dit que Bob ment ; Bob dit que Clara ment ; Clara dit que Alice ne dit ni vrai ni faux',
    Propositions: [
        new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
        new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p3, V0])]),
        new Proposition(OperateurEgalStrict, [p3, new Proposition(OperateurEgalFlou, [p1, V2])]),
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 2 avec observateur',
    Formule: 'P1 <span class="egalstrict"></span> (P2 <span class="egalflou"></span> <span class="v0"></span>) ; P2 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v0"></span>) ; P3 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v2"></span>)',
    Description: 'Alice dit que Bob ment ; Bob dit que Alice ment ; Clara dit que Alice ne dit ni vrai ni faux',
    Propositions: [
        new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
        new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p1, V0])]),
        new Proposition(OperateurEgalStrict, [p3, new Proposition(OperateurEgalFlou, [p1, V2])]),
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 2, variante',
    Formule: 'P1 <span class="egalstrict"></span> (P2 <span class="egalflou"></span> <span class="v0"></span>) ; P2 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v1"></span>)',
    Description: 'Alice dit que Bob ment ; Bob dit que Alice dit vrai',
    Propositions: [
        new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
        new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p1, V1])])
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 2 avec observateur, variante',
    Formule: 'P1 <span class="egalstrict"></span> (P2 <span class="egalflou"></span> <span class="v0"></span>) ; P2 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v1"></span>) ; P3 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v2"></span>)',
    Description: 'Alice dit que Bob ment ; Bob dit que Alice dit vrai ; Clara dit que Alice ne dit ni vrai ni faux',
    Propositions: [
        new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
        new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p1, V1])]),
        new Proposition(OperateurEgalStrict, [p3, new Proposition(OperateurEgalFlou, [p1, V2])]),
    ]
}));

// Problèmes multivalués
var OperateurDireverite = new OperateurDireveriteMulti();
var Chat = new Variable('CHAT');
var Alice = new Variable('ALICE');
var Bob = new Variable('BOB');
Problemes.push(new ProblemeMultivalue({
    Nom: 'Chat multivalué',
    Formule: 'CHAT = DIREVERITE(ALICE, 1T) ; CHAT = DIREVERITE(ALICE, 0T) ; ALICE = DIREVERITE(BOB,  1)',
    Description: 'Alice dit que le chat est blanc. Alice dit que le chat est noir. Bob dit que Alice est strictement sincère.',
    Propositions: [
        new Proposition(OperateurEgalStrict, [Chat, new Proposition(OperateurDireverite, [Alice, new OperateurMultivaleur([1,3])])]),
        new Proposition(OperateurEgalStrict, [Chat, new Proposition(OperateurDireverite, [Alice, new OperateurMultivaleur([0,3])])]),
        new Proposition(OperateurEgalStrict, [Alice, new Proposition(OperateurDireverite, [Bob, new OperateurMultivaleur([1])])]),
    ]
}));

var OperateurOuM = new OperateurOuMulti();
var OperateurEtM = new OperateurEtMulti();
var OperateurNotM = new OperateurNotMulti();
var OperateurEgalStrictM = new OperateurEgalStrictMulti();
var Plien312OAY = new Variable('Plien312OAY');
var Pmention312parOAYavant = new Variable('Pmention312parOAYavant');
var Pmention312parOAYapres = new Variable('Pmention312parOAYapres');
var Pmetallicite = new Variable('Pmetallicite');
var PcreaFaussaire = new Variable('PcreaFaussaire');
Problemes.push(new ProblemeMultivalue({
    Nom: 'Authenticité de @312_oay',
    Formule: 'Plien312OAY = (Pmention312parOAYavant && !PcreaFaussaire) || Pmention312parOAYapres || Pmetallicite',
    Description: 'Etude de l\'authenticité du compte #312_oay, formule en cours d\'écriture',
    Propositions: [
        new Proposition(OperateurEgalStrictM, [Plien312OAY,
            new Proposition(OperateurOuM, [
                Pmetallicite,
                new Proposition(OperateurOuM, [
                    Pmention312parOAYapres,
                    new Proposition(OperateurEtM, [
                        Pmention312parOAYavant,
                        new Proposition(OperateurNot, [PcreaFaussaire])
                    ])
                ])
            ])]),
        new Proposition(OperateurEgalStrictM, [Pmention312parOAYavant, new Proposition(new OperateurMultivaleur([1]))]),
        new Proposition(OperateurEgalStrictM, [Pmention312parOAYapres, new Proposition(new OperateurMultivaleur([1]))]),
        new Proposition(OperateurEgalStrictM, [PcreaFaussaire, new Proposition(new OperateurMultivaleur([1]))]),
        new Proposition(OperateurEgalStrictM, [Pmetallicite, new Proposition(new OperateurMultivaleur([1]))]),
        new Proposition(OperateurEgalStrictM, [Plien312OAY, new Proposition(new OperateurMultivaleur([1]))]),
    ]
}));

var AfficherLibellesValeurs = function($elt) {
    if ($elt == undefined) $elt = $(document);
    for (var i=0; i<4; i++) {
        $elt.find('.definitions .valeurs [name=v' + i + ']').val(libellesValeurs[i]);
        $elt.find('.v' + i).html(libellesValeurs[i]);
    }
}

var AfficherLibellesOperateurs = function($elt) {
    if ($elt == undefined) $elt = $(document);
    $elt.find('.definitions .operateurs [name=egalstrict]').val(OperateurEgalStrict.Symbole);
    $elt.find('.definitions .operateurs [name=egalflou]').val(OperateurEgalFlou.Symbole);
    $elt.find('.definitions .operateurs [name=not]').val(OperateurNot.Symbole);
    $elt.find('.definitions .operateurs [name=implique]').val(OperateurImplique.Symbole);
    $elt.find('span.egalstrict').html(OperateurEgalStrict.Symbole);
    $elt.find('span.egalflou').html(OperateurEgalFlou.Symbole);
    $elt.find('span.not').html(OperateurNot.Symbole);
    $elt.find('span.implique').html(OperateurImplique.Symbole);
}

var ResoudreProblemes = function() {
    ConstruireTableVerite(); // Chaque problème ajoutera sa colonne dans la table de vérité donc remettons là à 0
    for (var probleme of Problemes)
        if (probleme.EstActif)
            probleme.Resoudre();
    AfficherLibellesOperateurs(); // Uniquement à cause des problèmes qui ont mis leur formule dans la table de vérite :(
}

var ConstruireTableVerite = function() { // Construire ou reconstruire la table de vérité dans la div prévue à cet effet
    $table = $('.tableverite').html('<table></table>').children();
    $table.append($trheader = $('<tr class="header"></tr>'));
    $trheader.append('<th>A</th><th>B</th><th>C</th>');
    var operateurs = [OperateurNot, OperateurEgalStrict, OperateurEgalFlou, OperateurImplique];
    for (var operateur of operateurs) $trheader.append('<th>' + operateur.ToStringABC() + '</th>')
    for (var c=0; c<4; c++) {
        for (var a=0; a<4; a++) {
            for (var b=0; b<4; b++) {
                $table.append($tr = $('<tr a="' + a + '" b="' + b + '" c="' + c + '"></tr>'));
                if (c==0 && a==3 && b==3) $tr.addClass('lastab');
                $tr.append('<td>' + libellesValeurs[a] + '</td><td>' + libellesValeurs[b] + '</td><td>' + libellesValeurs[c] + '</td>');
                for (var i in operateurs) {
                    var operateur = operateurs[i];
                    $tr.append('<td>' + libellesValeurs[operateur.Calculer(null,[a,b,c])] + '</td>');
                }
            }
        }
    }
}

var BrancherTooltips = function($elt) {
    $elt.find('[tip]').tooltip({
        content: function () {
            return $(this).attr('tip');
        },
        items: '[tip]',
        show: false,
        hide: false,
        track: true
    });

};

$(document).ready(function() {


    // Remplir les select de valeurs
    $('select.valeurs').each(function() {
        for (var i=0; i<4; i++)
            $(this).append('<option value="' + i + '" class="v' + i + '">' + + '</option>');
        $(this).val($(this).attr('defaut'));
    });

    // Afficher les jeux de libellés de valeurs
    var html = $('.jeuxnomsvaleurs').html();
    for (var i in JeuxLibellesValeurs) {
        html += '<br><a href="#" jeuvaleur="' + i + '">' + i + '</a>';
    }
    $('.jeuxnomsvaleurs').html(html);

    $('a[jeuvaleur]').on('click', function() {
        libellesValeurs = JeuxLibellesValeurs[$(this).attr('jeuvaleur')];
        AfficherLibellesValeurs();
        ResoudreProblemes();
    })

    $('input[name=details]').on('change', function() {
        CalculsDetailles = $(this).is(':checked');
        ResoudreProblemes();
    });

    // Permettre de déplier les paramètres des opérateurs
    $('div.operateur').each(function() {
        var $operateur = $(this);
        $operateur.find('h4').append('<span class="toggler"> &#9658;</span>').css('cursor', 'pointer').on('click', function() {
            $depliable = $operateur.find('.depliable');
            $operateur.find('.toggler').remove();
            if ($depliable.is(':visible')) {
                $depliable.hide();
                $operateur.find('h4').append('<span class="toggler"> &#9658;</span>')
            } else {
                $depliable.show();
                $operateur.find('h4').append('<span class="toggler"> &#9660;</span>')
            }
        });
    });

    // Afficher les problèmes
    for (var probleme of Problemes)
        probleme.InjectHtml();
    Problemes[13].Augmenter();

    AfficherLibellesValeurs();
    AfficherLibellesOperateurs();

    // Observer les changements de symbole des opérateurs
    $('input.symboleoperateur').on('change keypress keyup', function() {
        var operateur = Operateur.GetFromClasse($(this).attr('name'));
        if (operateur != null) operateur.Symbole = $(this).val();
        AfficherLibellesOperateurs();
    })

    // Observer les changements de définition des opérateurs
    $('div.definitions select').on('change', function() {
        var name = $(this).attr('name').split('-');
        var nomOperateur = name.shift(); // Premier élément
        var operateur = Operateur.GetFromClasse(nomOperateur);
        var args = name; // Autres éléments
        switch (operateur.Arite) {
            case 1:
                operateur.Valeurs[parseInt(args[0][1], 10)] = parseInt($(this).val(), 10);
                break;
            case 2:
                operateur.Valeurs[parseInt(args[0][1], 10)][parseInt(args[1][1], 10)] = parseInt($(this).val(), 10);
                break;
        }
        ResoudreProblemes();
    });

    ResoudreProblemes();

});