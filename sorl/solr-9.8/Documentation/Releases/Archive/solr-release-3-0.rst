.. _releases-archive-3-0:

============
Releases 3.0
============

Release 3.0.0
=============

Apache Solr for TYPO3 version 3.0 released

We're happy to announce the release of Apache Solr for TYPO3 (EXT:solr) version 3.0.0. With this release we now support TYPO3 CMS versions 4.5 to 6.2, and Apache Solr version 4.8.

A couple weeks ago we released Apache Solr for TYPO3 version 3.0 to the TYPO3 Extension Repository. Even without this announcement we have seen quite a few downloads already and have also been able to help projects update to the current version even during the development phase.

New in this Release
-------------------

TYPO3 CMS 6.2 LTS
~~~~~~~~~~~~~~~~~

We added support for TYPO3 CMS 6.2 LTS while still supporting version 4.5 LTS to allow an easy upgrade. Which means you can now use system categories to build hierarchical facets, and on the code side we moved a lot of code around to match the file and folder structure of extbase extensions.
All New Search Backend Module

If you are running TYPO3 CMS version 6.0 or newer you will be pleased to find a completely new backend module to get an overview of your Solr installation, the Index Queue, and execute index maintenance tasks.

The new backend module is designed so that it can easily be extended with sub-modules. One such sub-module is the new synonyms module allowing you to manage synonyms for your site keywords. Further modules are planned and we also encourage others to add functionality using the new API.

Apache Solr 4.8
~~~~~~~~~~~~~~~

In the background we also updated Apache Solr to version 4.8 which brings new features and allows us to make things even easier for integrators.

New features resulting from the Solr update include highlighting elevated search results (editorial or paid content).

When indexing content before, you had to wait for Solr to commit newly added documents before seeing the changes show up in the search results. This is not necessary anymore as Solr 4.0 added near real time search and automatic soft commits, meaning that documents added to the Solr index now become searchable immediately.

General Changes
---------------

Overall we have resolved close to 80 issues adding up to almost 400 changes. Other than the changes listed above we also added support for limiting a search to certain branches of the page tree. Of course the usual bug fixes and performance improvements were added as well, too.

Updating
--------

During the reorganization of the files and folders we also moved the TypoScript configuration files. Because of this the include path for these files will not match anymore. You can simply re-add the TypoScript in the Include Static section of your template record. We also added an upgrade script that does that for you automatically.

Two scheduler tasks have been removed; the commit scheduler task was meant for development purposes only anyway and is not needed anymore thanks to Solr's automatic soft commits. The optimize task has been removed since its name was a bit misleading and in certain situations it could do more harm than any good.

Outlook
=======

The release of version 3.0 lays the foundation for further changes to come in keeping the extension up to date with developments in both TYPO3 CMS and Apache Solr, providing the best search experience available for TYPO3 CMS.

New add-ons like FAL file indexing and updated versions of existing add-on extensions will be provided through the Early Access Program.

There may be one or two more minor release in the 3.x branch to deliver features that did not make it in 3.0. After that we will be moving on to the development of 4.0 which will have a minimum requirement of TYPO3 CMS 6.2 LTS. The main goal for version 4 will be switching to Fluid for templating and adding namespaces.

Contributors
============

Like always this release would not have been possible without the help from our awesome community. These are the contributors for this release.

(patches, comments, bug reports, ... no particular order)

* Sascha Egerer
* John Foushee
* Tolleiv Nietsch
* Dmitry Dulepov
* Stefan Galinski
* Franz G. Jahn
* Hauke Meyer
* Jonas Götze
* Joschi Kuphal
* Kay Strobach
* Stefan Sprenger
* Marc Bastian Heinrichs
* Lienhart Woitok
* Kai Vogel
* Jochen Rieger
* Irene Höppner
* Tomita Militaru
* Jan Kiesewetter
* Lars Peipmann
* Markus Kobligk
* Michael Knabe
* Michiel Roos
* Peter Kraume
* Gerrit Venema
* Michel Tremblay
* Lucas Jenss
* Steffen Ritter
* Hans Höchtl
* Stefan Neufeind
* Soren Malling
* Witali Rott
* Bernhard Kraft
* Phuong Doan
* Stephan Schuler
* Tim Werdin
* Rik Willems
* Rémy Daniel
* Andreas Lappe
* Sascha Nowak
* Alexander Stehlik
* Hans Höchtl
* Cyrel Wolfangel
* Georg Kuehnberger
* Jan-Erik Revsbech
* Gabe Blair
* Bart Gijswijt
* Arjen Hoekema


Thanks to everyone who helped in creating this release!

