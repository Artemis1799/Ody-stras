using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class SecurityZone
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    public Guid EventId { get; set; }
    
    [Required]
    public Guid EquipmentId { get; set; }
    
    [Required]
    public int Quantity { get; set; }
    
    public string? Comment { get; set; }
    
    [Required]
    public DateTime InstallationDate { get; set; }
    
    [Required]
    public DateTime RemovalDate { get; set; }
    
    [Required]
    [Column(TypeName = "TEXT")]
    public string GeoJson { get; set; } = string.Empty;
    
    public Guid? InstallationTeamId { get; set; }
    
    public Guid? RemovalTeamId { get; set; }
    
    [ForeignKey("EventId")]
    [JsonIgnore]
    public Event? Event { get; set; }
    
    [ForeignKey("EquipmentId")]
    public Equipment? Equipment { get; set; }
    
    [ForeignKey("InstallationTeamId")]
    public Team? InstallationTeam { get; set; }
    
    [ForeignKey("RemovalTeamId")]
    public Team? RemovalTeam { get; set; }
    
    [JsonIgnore]
    public ICollection<Action>? Actions { get; set; }
    
    [JsonIgnore]
    public ICollection<Picture>? Pictures { get; set; }
}
